import { BirParser } from "./parser/parser.ts";
import Bir from "./ast.ts";
import { parse, join } from "https://deno.land/std@0.106.0/path/mod.ts";
import BirUtil from "./util.ts";
import Scope from "./scope.ts";
import BirError, { ErrorReport } from "./error.ts";
import Implementor from "./implementor/implementor.ts";

export default class BirEngine {
	callstack: BirUtil.Callstack[];
	scopestack: Scope[];
	filename: string;
	directory: string;
	content: string;
	parsed: Bir.Program;
	errorReport: ErrorReport;
	maximumCallstackSize: number;
	standardPath: string;

	constructor(public path: string) {
		this.maximumCallstackSize = 8000;
		this.callstack = [];
		this.scopestack = [];
		this.filename = "";
		this.directory = "";
		this.content = "";
		this.standardPath = join(Deno.cwd(), "bir");
		this.errorReport = this;
		this.parsed = { imports: [], program: [] };
	}

	async init(): Promise<void> {
		this.scopestack = [new Scope([])];
		const parsed = parse(this.path);
		const parser = new BirParser();
		const decoder = new TextDecoder();

		this.filename = parsed.base;
		this.directory = parsed.dir;
		this.content = decoder.decode(await Deno.readFile(this.path));
		this.parsed = parser.parse(this.content);
		this.callstack = [{ name: "main", stack: this.parsed.program }];
		this.currentScope.addBlock(Implementor.Interface(this));
		this.errorReport = {
			filename: this.filename,
			path: this.path,
			callstack: this.callstack,
			content: this.content,
		};

		for await (const use of this.parsed.imports) {
			let dir = Deno.readDir(this.standardPath);
			let exists = false;
			let target;
			for await (const file of dir) {
				let name = parse(file.name).name;
				if (file.isFile && name === use.source.value) {
					exists = true;
					target = join(this.standardPath, file.name);
					break;
				}
			}

			if (exists) {
				let useEngine = new BirEngine(target as string);
				await useEngine.init();
				await useEngine.run();
				let parentScope = useEngine.currentScope;
				parentScope.immutable = true;
				parentScope.foreign = true;
				this.currentScope.parents.push(parentScope);
			} else {
				new BirError(
					this,
					`Cannot find use library '${use.source.value}'`,
					use.position
				);
			}
		}
	}

	get currentCallstack(): BirUtil.Callstack {
		return this.callstack[this.callstack.length - 1];
	}

	get currentScope(): Scope {
		return this.scopestack[this.scopestack.length - 1];
	}

	async run(): Promise<void> {
		await this.resolveCallstack(this.currentCallstack);
	}

	async resolveCallstack(
		stack: BirUtil.Callstack
	): Promise<Bir.IntPrimitiveExpression> {
		let value = BirUtil.generateInt(0);

		for await (const statement of stack.stack) {
			switch (statement.operation) {
				case "variable_declaration":
					await this.resolveVariableDeclarationStatement(statement);
					break;
				case "return_statement":
					value = await this.resolveExpression(statement.expression);
					this.callstack.pop();
					return value;
				case "block_declaration":
					await this.resolveBlockDeclaration(statement);
					break;
				case "native_block_declaration":
					await this.resolveNativeBlockDeclaration(
						statement as Bir.NativeBlockDeclarationStatement
					);
					break;
				case "quantity_modifier_statement":
					await this.resolveQuantityModifier(statement);
					break;
				case "assign_statement":
					await this.resolveAssignStatement(statement);
					break;
				case "block_call":
					await this.resolveBlockCall(statement);
					break;
				case "for_statement":
					await this.resolveForStatement(statement);
					break;
				case "while_statement":
					await this.resolveWhileStatement(statement);
					this.callstack.pop();
					return value;
				case "if_statement":
					value = await this.resolveIfStatement(statement);
					this.callstack.pop();
					return value;
				default:
					break;
			}
		}

		this.callstack.pop();
		return value;
	}

	async resolveWhileStatement(statement: Bir.WhileStatement): Promise<void> {
		let condition = await this.resolveExpression(statement.statement);

		while (condition.value === 1) {
			this.callstack.push({ name: "anonymous-while", stack: statement.body });
			await this.resolveCallstack(this.currentCallstack);
			condition = await this.resolveExpression(statement.statement);
		}
	}

	async resolveIfStatement(
		statement: Bir.IfStatement
	): Promise<Bir.IntPrimitiveExpression> {
		let mainBlock = await this.resolveIfBlock(statement.condition);

		let runBlock = async (block: Bir.Main[]) => {
			// this.scopestack.push(new Scope([this.currentScope]));
			this.callstack.push({ name: "anonymous-if", stack: block });
			let result = await this.resolveCallstack(this.currentCallstack);
			// this.scopestack.pop();
			return result;
		};

		if (mainBlock.value === 1) {
			return await runBlock(statement.body);
		} else {
			if (statement.elifs) {
				let selectedElif = null;
				for await (const elif of statement.elifs) {
					let elifBlock = await this.resolveIfBlock(elif.condition);
					if (elifBlock.value === 1) {
						selectedElif = elif;
						break;
					}
				}

				if (selectedElif) {
					return await runBlock(selectedElif.body);
				} else {
					if (statement.else) {
						return await runBlock(statement.else);
					}
				}
			}
		}

		return BirUtil.generateInt(0);
	}

	async resolveIfBlock(condition: Bir.Expression) {
		return await this.resolveExpression(condition);
	}

	async resolveForStatement(statement: Bir.ForStatement): Promise<void> {
		let iterator = await this.resolveExpression(statement.statement);

		for (let i = 0; i < iterator.value; i++) {
			let scope = new Scope([this.currentScope]);
			scope.push(
				BirUtil.generateIdentifier(statement.placeholder),
				BirUtil.generateInt(i),
				"const"
			);
			this.scopestack.push(scope);

			this.callstack.push({ name: "anonymous-for", stack: statement.body });
			await this.resolveCallstack(this.currentCallstack);
			this.scopestack.pop();
		}
	}

	async resolveVariableDeclarationStatement(
		statement: Bir.VariableDeclarationStatement
	): Promise<void> {
		let key = statement.left;

		if (this.currentScope.find(key.value) === undefined) {
			let value = await this.resolveExpression(statement.right);

			this.currentScope.push(statement.left, value, statement.kind);
		} else {
			new BirError(
				this.errorReport,
				`Variable '${key.value}' has already been declared`,
				statement.position
			);
		}
	}

	async resolveBlockDeclaration(
		statement: Bir.BlockDeclarationStatement
	): Promise<void> {
		statement.owner = this;
		if (!statement.implementing) {
			if (statement.body.init) {
				let instance = new Scope([]);
				let initScope = new Scope([this.currentScope]);
				this.scopestack.push(initScope);
				this.callstack.push({
					name: `${statement.name.value}:init`,
					stack: JSON.parse(JSON.stringify(statement.body.init)),
				});
				await this.resolveCallstack(this.currentCallstack);
				let lastScope = this.scopestack.pop();
				if (lastScope) {
					instance = lastScope;
				}
				statement.instance = instance;
				statement.initialized = true;
			}

			if (
				this.currentScope.findBlock(statement.name.value).block === undefined
			) {
				this.currentScope.addBlock(statement);
			} else {
				new BirError(
					this.errorReport,
					`Block '${statement.name.value}' has already been declared`,
					statement.position
				);
			}
		} else {
			let supBlock = this.currentScope.findBlock(statement.implements.value)
				.block as Bir.BlockDeclarationStatement;

			if (supBlock) {
				let copy: Bir.BlockDeclarationStatement = { ...supBlock };

				if (supBlock.body.init) {
					let instance = new Scope([]);
					let initScope = new Scope([this.currentScope]);
					this.scopestack.push(initScope);
					this.callstack.push({
						name: copy.name.value,
						stack: JSON.parse(JSON.stringify(copy.body.init)),
					});
					await this.resolveCallstack(this.currentCallstack);
					let lastScope = this.scopestack.pop();
					if (lastScope) {
						instance = lastScope;
					}
					statement.instance = instance;
					statement.initialized = true;
				}

				statement.arguments = supBlock.arguments;
				statement.verbs = supBlock.verbs;
				statement.body = supBlock.body;

				if (statement.populate) {
					switch (statement.populate.type) {
						case "string":
							var i = 0;
							for (const value of statement.populate.value.split("")) {
								statement.instance.push(
									BirUtil.generateIdentifier(`value_${i}`),
									BirUtil.generateInt(value.charCodeAt(0)),
									"let"
								);
								i++;
							}

							var index = statement.instance.find("index");

							if (index) {
								index.value = statement.populate.value.length;
							}
							break;
						case "array":
							var i = 0;
							for (const primitive of statement.populate.values) {
								statement.instance.push(
									BirUtil.generateIdentifier(`value_${i}`),
									BirUtil.generateInt(primitive.value),
									"let"
								);
								i++;
							}
							
							var index = statement.instance.find("index");

							if (index) {
								index.value = statement.populate.values.length;
							}
							break;
					}
				}

				if (
					this.currentScope.findBlock(statement.name.value).block === undefined
				) {
					this.currentScope.addBlock(statement);
				} else {
					new BirError(
						this.errorReport,
						`Block '${statement.name.value}' has already been declared`,
						statement.position
					);
				}
			} else {
				new BirError(
					this.errorReport,
					`Could not find block '${statement.implements.value}' to implement`,
					statement.implements.position
				);
			}
		}
	}

	async resolveNativeBlockDeclaration(
		statement: Bir.NativeBlockDeclarationStatement
	): Promise<void> {
		if (this.currentScope.findBlock(statement.name.value).block === undefined) {
			this.currentScope.addBlock(statement);
		} else {
			new BirError(
				this.errorReport,
				`Block '${statement.name.value}' has already been declared`,
				statement.position
			);
		}
	}

	async resolveAssignStatement(statement: Bir.AssignStatement): Promise<void> {
		let right = await this.resolveExpression(statement.right);
		let result = await this.currentScope.update(statement.left.value, right);

		if (this.currentScope.find(statement.left.value)) {
			if (result === 1) {
				new BirError(
					this.errorReport,
					`Could not reassign to const variable '${statement.left.value}'`,
					statement.position
				);
			} else if (result === 2) {
				new BirError(
					this.errorReport,
					`Could not reassign in immutable scope`,
					statement.position
				);
			}
		} else {
			new BirError(
				this.errorReport,
				`Could not find reference ${statement.left.value} in the scope`,
				statement.position
			);
		}
	}

	async resolveQuantityModifier(
		statement: Bir.QuantityModifierStatement
	): Promise<Bir.IntPrimitiveExpression> {
		let newValue;
		let reference = await this.resolveExpression(statement.statement);

		switch (statement.type) {
			case "increment":
				newValue = reference.value + 1;
				break;
			case "decrement":
				newValue = reference.value - 1;
				break;
			case "add":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				newValue = reference.value + right.value;
				break;
			case "subtract":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				newValue = reference.value - right.value;
				break;
			case "multiply":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				newValue = reference.value * right.value;
				break;
			case "divide":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				newValue = reference.value / right.value;
				break;
		}

		if (statement.statement.operation === "reference") {
			let result = await this.currentScope.update(
				statement.statement.value,
				BirUtil.generateInt(newValue)
			);

			if (result === 1) {
				new BirError(
					this.errorReport,
					`Could not reassign to const variable '${statement.statement.value}'`,
					statement.position
				);
			} else if (result === 2) {
				new BirError(
					this.errorReport,
					`Could not reassign in immutable scope`,
					statement.position
				);
			}

			return BirUtil.generateInt(0);
		} else {
			reference.value = newValue;
			return reference;
		}
	}

	async resolveExpression(
		expression: Bir.Expression
	): Promise<Bir.IntPrimitiveExpression> {
		switch (expression.operation) {
			case "arithmetic":
				return await this.resolveArithmeticExpression(expression);
			case "condition":
				return await this.resolveConditionExpression(expression);
			case "block_call":
				var r = await this.resolveBlockCall(expression);
				return r;
			case "primitive":
				return expression as Bir.IntPrimitiveExpression;
			case "reference":
				let result = this.currentScope.find(expression.value);
				if (result) {
					return result;
				} else {
					new BirError(
						this.errorReport,
						`Could not find reference ${expression.value} in the scope`,
						expression.position
					);
					return BirUtil.generateInt(0);
				}
		}
	}

	async resolveBlockCall(
		expression: Bir.BlockCallExpression,
		incoming: BirEngine | null = null
	): Promise<Bir.IntPrimitiveExpression> {
		if (this.callstack.length < this.maximumCallstackSize) {
			let { block, foreign } = this.currentScope.findBlock(
				expression.name.value
			);

			if (block) {
				if (block.operation === "block_declaration") {
					if (foreign) {
						let scopestack = block.owner.scopestack;
						block.owner.currentScope.foreign = false;
						block.owner.callstack = this.callstack;
						block.owner.scopestack = block.owner.scopestack.concat(
							this.scopestack
						);
						let result = await block.owner.resolveBlockCall(expression, this);
						block.owner.callstack = [];
						block.owner.scopestack = scopestack;
						block.owner.currentScope.foreign = true;
						return result;
					} else {
						let errors = [];

						for (let i = 0; i < block.arguments?.length; i++) {
							let expected = block.arguments[i];
							let given = expression.arguments[i];

							if (!given) {
								errors.push(
									`Expected a parameter for argument '${expected.value}'`
								);
							}
						}

						for (let i = 0; i < block.verbs.length; i++) {
							let expected = block.verbs[i];
							let given = expression.verbs[i];

							if (!given) {
								errors.push(
									`Expected a parameter for verb '${expected.value}'`
								);
							}
						}

						if (errors.length > 0) {
							if (incoming) {
								new BirError(
									incoming.errorReport,
									errors.join("\n"),
									expression.position
								);
							} else {
								new BirError(
									this.errorReport,
									errors.join("\n"),
									expression.position
								);
							}
						}

						let scope = new Scope([this.currentScope]);
						if (block.body.init) {
							scope.parents.splice(0, 0, block.instance);
						}

						if (block.arguments) {
							let i = 0;
							for await (let expected of block.arguments) {
								let given;
								if (incoming) {
									given = await incoming.resolveExpression(
										expression.arguments[i]
									);
								} else {
									given = await this.resolveExpression(expression.arguments[i]);
								}

								scope.push(
									BirUtil.generateIdentifier(expected.value),
									given,
									"let"
								);
								i++;
							}
						}

						let i = 0;
						for await (let expected of block.verbs) {
							let given;
							if (incoming) {
								given = await incoming.resolveExpression(expression.verbs[i]);
							} else {
								given = await this.resolveExpression(expression.verbs[i]);
							}

							scope.push(
								BirUtil.generateIdentifier(expected.value),
								given,
								"let"
							);
							i++;
						}

						this.scopestack.push(scope);
						this.callstack.push({
							name: block.name.value,
							stack: JSON.parse(JSON.stringify(block.body.program)),
						});
						let result = await this.resolveCallstack(this.currentCallstack);
						this.scopestack.pop();
						return result;
					}
				} else {
					let vs: Bir.IntPrimitiveExpression[] = [],
						as: Bir.IntPrimitiveExpression[] = [];

					for await (const v of expression.verbs) {
						vs.push(await this.resolveExpression(v));
					}

					for await (const a of expression.arguments) {
						as.push(await this.resolveExpression(a));
					}

					return await block.body(this, vs, as);
				}
			} else {
				new BirError(
					this.errorReport,
					`Could not find block '${expression.name.value}'`,
					expression.position
				);
			}
		} else {
			new BirError(
				this.errorReport,
				"Birlang script has overflown the maximum callstack size.",
				expression.position
			);
		}

		return BirUtil.generateInt(0);
	}

	async resolveConditionExpression(
		expression: Bir.ConditionExpression
	): Promise<Bir.IntPrimitiveExpression> {
		let value: number;
		let left = await this.resolveExpression(expression.left);
		let right = await this.resolveExpression(expression.right);

		switch (expression.type) {
			case "equals":
				value = left.value === right.value ? 1 : 0;
				return BirUtil.generateInt(value);
			case "not_equals":
				value = left.value === right.value ? 0 : 1;
				return BirUtil.generateInt(value);
			case "less_than":
				value = left.value < right.value ? 1 : 0;
				return BirUtil.generateInt(value);
			case "less_than_equals":
				value = left.value <= right.value ? 1 : 0;
				return BirUtil.generateInt(value);
			case "not_less_than":
				value = left.value < right.value ? 0 : 1;
				return BirUtil.generateInt(value);
			case "not_less_than_equals":
				value = left.value <= right.value ? 0 : 1;
				return BirUtil.generateInt(value);
			case "greater_than":
				value = left.value > right.value ? 1 : 0;
				return BirUtil.generateInt(value);
			case "greater_than_equals":
				value = left.value >= right.value ? 1 : 0;
				return BirUtil.generateInt(value);
			case "not_greater_than":
				value = left.value > right.value ? 0 : 1;
				return BirUtil.generateInt(value);
			case "not_greater_than_equals":
				value = left.value >= right.value ? 0 : 1;
				return BirUtil.generateInt(value);
			default:
				value = 0;
				return BirUtil.generateInt(value);
		}
	}

	async resolveArithmeticExpression(
		expression: Bir.ArithmeticExpression
	): Promise<Bir.IntPrimitiveExpression> {
		let value: number;
		let left = await this.resolveExpression(expression.left);
		let right = await this.resolveExpression(expression.right);

		switch (expression.type) {
			case "addition":
				value = left.value + right.value;
				return BirUtil.generateInt(value);
			case "subtraction":
				value = left.value - right.value;
				return BirUtil.generateInt(value);
			case "multiplication":
				value = left.value * right.value;
				return BirUtil.generateInt(value);
			case "division":
				value = left.value / right.value;
				return BirUtil.generateInt(value);
			case "exponent":
				value = Math.pow(left.value, right.value);
				return BirUtil.generateInt(value);
			case "modulus":
				value = left.value % right.value;
				return BirUtil.generateInt(value);
			case "root":
				value = Math.pow(left.value, 1 / right.value);
				return BirUtil.generateInt(value);
		}
	}
}
