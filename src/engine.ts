import { BirParser } from "./parser/parser.ts";
import Bir from "./ast.ts";
import { parse } from "https://deno.land/std@0.106.0/path/mod.ts";
import BirUtil from "./util.ts";
import Scope from "./scope.ts";
import BirError, { ErrorReport } from "./error.ts";
import Implementor from "../bir/implementor.bir.ts"

export default class BirEngine {
	callstack: BirUtil.Callstack[];
	scopestack: Scope[];
	filename: string;
	directory: string;
	content: string;
	parsed: Bir.Program;
	errorReport: ErrorReport;
	maximumCallstackSize;

	constructor(public path: string) {
		this.maximumCallstackSize = 8000;
		this.callstack = [];
		this.scopestack = [];
		this.filename = "";
		this.directory = "";
		this.content = "";
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
		this.currentScope.addBlock(Implementor.EngineInterface)
		this.errorReport = {
			filename: this.filename,
			path: this.path,
			callstack: this.callstack,
			content: this.content,
		};
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
					this.callstack.pop();
					value = await this.resolveExpression(statement.expression);
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
					await this.resolveassignStatement(statement);
					break;
				case "block_call":
					await this.resolveBlockCall(statement);
					break;
				default:
					break;
			}
		}

		this.callstack.pop();

		return value;
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
		if (!statement.implementing) {
			if (this.currentScope.findBlock(statement.name.value) === undefined) {
				this.currentScope.addBlock(statement);
			} else {
				new BirError(
					this.errorReport,
					`Block '${statement.name.value}' has already been declared`,
					statement.position
				);
			}
		} else {
			let supBlock = this.currentScope.findBlock(
				statement.implements.value
			) as Bir.BlockDeclarationStatement;

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
					copy.superInstance = instance;
				}

				statement.arguments = supBlock.arguments;
				statement.verbs = supBlock.verbs;
				statement.body = supBlock.body;

				if (this.currentScope.findBlock(statement.name.value) === undefined) {
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
		if (this.currentScope.findBlock(statement.name.value) === undefined) {
			this.currentScope.addBlock(statement);
		} else {
			new BirError(
				this.errorReport,
				`Block '${statement.name.value}' has already been declared`,
				statement.position
			);
		}
	}

	async resolveassignStatement(statement: Bir.AssignStatement): Promise<void> {
		let right = await this.resolveExpression(statement.right);
		let result = await this.currentScope.update(statement.left.value, right);

		if (this.currentScope.find(statement.left.value)) {
			if (!result) {
				new BirError(
					this.errorReport,
					`Could not reassign to const variable ${statement.left.value}`,
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
		let reference = await this.resolveExpression(statement.statement);

		switch (statement.type) {
			case "increment":
				reference.value++;
				return reference;
			case "decrement":
				reference.value--;
				return reference;
			case "add":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				reference.value += right.value;
				return reference;
			case "subtract":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				reference.value -= right.value;
				return reference;
			case "multiply":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				reference.value *= right.value;
				return reference;
			case "divide":
				var right = await this.resolveExpression(
					statement.right as Bir.Expression
				);
				reference.value /= right.value;
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
		expression: Bir.BlockCallExpression
	): Promise<Bir.IntPrimitiveExpression> {
		if (this.callstack.length < this.maximumCallstackSize) {
			let block = this.currentScope.findBlock(expression.name.value);

			if (block) {
				if (block.operation === "block_declaration") {
					let errors = [];

					for (let i = 0; i < block.arguments.length; i++) {
						let expected = block.arguments[i];
						let given = expression.arguments[i];

						if (!given) {
							errors.push(
								`Expected a parameter for argument '${expected.value}'`
							);
						}
					}

					if (errors.length > 0) {
						new BirError(
							this.errorReport,
							errors.join("\n"),
							expression.position
						);
					}

					if (block.body.init) {
						if (!block.initialized) {
							let instance = new Scope([]);
							let initScope = new Scope([this.currentScope]);
							this.scopestack.push(initScope);
							this.callstack.push({
								name: `${block.name.value}:init`,
								stack: JSON.parse(JSON.stringify(block.body.init)),
							});
							await this.resolveCallstack(this.currentCallstack);
							let lastScope = this.scopestack.pop();
							if (lastScope) {
								instance = lastScope;
							}
							await this.currentScope.flagBlockAsInitialized(
								block.name.value,
								instance
							);
						}
					}

					let scope = new Scope([block.instance, this.currentScope]);
					if (block.superInstance) {
						scope.parents.splice(1, 0, block.superInstance);
					}

					let i = 0;
					for await (let expected of block.arguments) {
						let given = await this.resolveExpression(expression.arguments[i]);

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
				} else {
					return block.body();
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
