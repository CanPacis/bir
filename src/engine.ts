import { BirParser } from "./parser/parser.ts";
import Bir from "./ast.ts";
import { parse } from "https://deno.land/std@0.106.0/path/mod.ts";

type Callstack = Bir.Main[];

class Scope {
	frame: Array<{ key: Bir.Identifier; value: Bir.IntPrimitiveExpression, kind: Bir.VariableKind }>;

	constructor(public parents: Array<Scope> = []) {
		this.frame = [];
	}

	push(key: Bir.Identifier, value: Bir.IntPrimitiveExpression, kind: Bir.VariableKind): void {
		this.frame.push({ key, value, kind });
	}
}

export default class BirEngine {
	callstack: Callstack[];
	scopestack: Scope[];
	filename: string;
	directory: string;
	content: string;
	parsed: Bir.Program;

	constructor(public path: string) {
		this.callstack = [];
		this.scopestack = [];
		this.filename = "";
		this.directory = "";
		this.content = "";
		this.parsed = { imports: [], program: [] };
	}

	async init(): Promise<void> {
		this.scopestack = [new Scope()];
		const parsed = parse(this.path);
		const parser = new BirParser();
		const decoder = new TextDecoder();

		this.filename = parsed.base;
		this.directory = parsed.dir;
		this.content = decoder.decode(await Deno.readFile(this.path));
		this.parsed = parser.parse(this.content);
		this.callstack = [this.parsed.program];
	}

	get currentCallstack(): Callstack {
		return this.callstack[this.callstack.length - 1];
	}

	get currentStack(): Bir.Main {
		return this.currentCallstack[0];
	}

	get currentScope(): Scope {
		return this.scopestack[this.scopestack.length - 1];
	}

	async run(): Promise<void> {
		while (this.callstack.length > 0) {
			await this.resolveCallstack();
		}
	}

	async resolveCallstack(): Promise<void> {
		while (this.currentCallstack.length > 0) {
			let statement = this.currentStack;

			switch (statement.operation) {
				case "variable_declaration":
					this.currentScope.push(statement.left, await this.resolveExpression(statement.right), statement.kind)
					this.currentCallstack.shift();
					return;
				case "return_statement":
					this.currentCallstack.shift();
					this.callstack.pop()
					return;
				default:
					this.currentCallstack.shift();
					return;
			}
		}
		this.callstack.pop();
	}

	async resolveStatement(): Promise<void> {}

	async resolveExpression(
		expression: Bir.Expression
	): Promise<Bir.IntPrimitiveExpression> {
		let value = {
			position: { line: 1, col: 1 },
			value: 0,
			operation: "primitive",
			type: "int",
		};

		switch (expression.operation) {
			case "arithmetic":
				return value as Bir.IntPrimitiveExpression;
			case "conditiion":
				return value as Bir.IntPrimitiveExpression;
			case "block_call":
				return value as Bir.IntPrimitiveExpression;
			case "primitive":
				return expression as Bir.IntPrimitiveExpression;
		}
	}
}
