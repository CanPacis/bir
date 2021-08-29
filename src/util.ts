import Bir from "./ast.ts";
import BirEngine from "./engine.ts";
import Scope from "./scope.ts";

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

	export function generateFunction(
		name: string,
		engine: BirEngine,
		body: (engine: BirEngine,verbs: Bir.IntPrimitiveExpression[], args: Bir.IntPrimitiveExpression[]) => Promise<Bir.IntPrimitiveExpression>
	): Bir.NativeBlockDeclarationStatement {
		return {
			owner: engine,
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

	export type Callstack = { name: string; stack: Bir.Main[] };
}

export default BirUtil;
