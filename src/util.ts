import Bir from "./ast.ts";

namespace BirUtil {
	export function generateIdentifier(identifier: string): Bir.Identifier {
		return {
			operation: "identifier",
			value: identifier,
			position: { line: 0, col: 0 },
		};
	}

	export function generateInt(value: number): Bir.IntPrimitiveExpression {
		return {
			operation: "primitive",
			value: parseInt(value as unknown as string),
			type: "int",
			position: { line: 0, col: 0 },
		};
	}

	export type Callstack = { name: string; stack: Bir.Main[] };
}

export default BirUtil;
