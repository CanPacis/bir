import Bir from "./ast.ts";
import BirEngine from "./engine.ts";
import { Scope } from "./scope.ts";

namespace BirUtil {
	export function generateIdentifier(
		identifier: string,
		negative: boolean = false
	): Bir.Identifier {
		return {
			operation: "identifier",
			value: identifier,
			negative,
			position: { line: 0, col: 0 },
		};
	}

	export function generateInt(value: number): Bir.IntPrimitiveExpression {
		if (Number.isNaN(parseInt(value as unknown as string))) {
			return {
				operation: "primitive",
				value: -1,
				type: "int",
				position: { line: 0, col: 0 },
			};
		} else {
			return {
				operation: "primitive",
				value: parseInt(value as unknown as string),
				type: "int",
				position: { line: 0, col: 0 },
			};
		}
	}

	export function generateFunction(
		name: string,
		owner: string,
		body: (
			engine: BirEngine,
			verbs: Bir.IntPrimitiveExpression[],
			args: Bir.IntPrimitiveExpression[]
		) => Promise<Bir.IntPrimitiveExpression>
	): Bir.NativeBlockDeclarationStatement {
		return {
			owner: owner,
			operation: "native_block_declaration",
			name: generateIdentifier(name),
			verbs: [],
			arguments: [],
			body: body,
			position: { col: 0, line: 0 },
			implementing: false,
			implements: generateIdentifier(""),
			initialized: false,
			instance: new Scope([]),
			superInstance: new Scope([]),
			foreign: false,
		};
	}

	export function uuidv4(): string {
		// @ts-ignore
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
			(
				c ^
				(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
			).toString(16)
		);
	}

	export function isPowerOfTen(input: number): boolean {
		if (input % 10 != 0 || input == 0) {
			return false;
		}

		if (input == 10) {
			return true;
		}

		return isPowerOfTen(input / 10);
	}

	export type Callstack = { name: string; stack: Bir.Main[] };

	export class IOBuffer {
		buffer: number[];

		constructor() {
			this.buffer = [];
		}

		push(value: number): void {
			this.buffer.push(value);
		}

		shift(): number | undefined {
			return this.buffer.shift();
		}

		assign(array: number[] | Uint8Array): void {
			this.buffer = Array.from(array);
		}

		clear(): void {
			this.buffer = [];
		}

		uint8Array(): Uint8Array {
			return Uint8Array.from(this.buffer);
		}

		get lastItem(): number {
			return this.buffer[this.buffer.length - 1];
		}

		trim() {
			while (this.lastItem === 10 || this.lastItem === 13) {
				this.buffer.pop();
			}
		}
	}
}

export default BirUtil;
