import Bir from "../ast.ts";
import BirEngine from "../engine.ts";
import BirUtil from "../util.ts";

enum InterfaceName {
	Read = 4206900,
	Push = 4206901,
	Assign = 4206902,
	Pop = 4206903,
	Dump = 4206904,
	Length = 4206905,
	Write = 4206906,
	Update = 4206907,
	Input = 4206908,
	Output = 4206909,
	Done = 4206910,
	Unknown = 4206911,
}

let input_buffer: number[] = [];
let output_buffer: number[] = [];

export default class Implementor {
	static Interface = (engine: BirEngine) =>
		BirUtil.generateFunction(
			"bir",
			engine,
			async (
				engine: BirEngine,
				verbs: Bir.IntPrimitiveExpression[],
				args: Bir.IntPrimitiveExpression[]
			) => {
				switch (verbs[0].value) {
					case InterfaceName.Read:
						return await Implementor.ScopeRead(engine, args);
					case InterfaceName.Push:
						return await Implementor.ScopePush(engine, args);
					// case InterfaceName.Assign:
					// 	return await Implementor.ScopeAssign(engine, args);
					// case InterfaceName.Input:
					// 	return await Implementor.ScopeInput(engine, args);
					case InterfaceName.Output:
						return await Implementor.ScopeOutput(engine, args);
					default:
						return BirUtil.generateInt(0);
				}
			}
		);

	static async ScopePush(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		let block = null;

		let i = 0;
		for (const stack of engine.callstack) {
			let scope = engine.currentScope.findBlock(stack.name);
			if (scope.block) {
				if (i === 0) {
					block = scope.block;
					break;
				} else {
					i++;
					continue;
				}
			}
		}

		if (block) {
			block.instance.push(
				BirUtil.generateIdentifier(`value_${args[0].value}`),
				args[1],
				"let"
			);
			return BirUtil.generateInt(1);
		} else {
			return BirUtil.generateInt(-1);
		}
	}

	static async ScopeRead(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		let block = null;

		let i = 0;
		for (const stack of engine.callstack) {
			let scope = engine.currentScope.findBlock(stack.name);
			if (scope.block) {
				if (i === 0) {
					block = scope.block;
					break;
				} else {
					i++;
					continue;
				}
			}
		}

		if (block) {
			return (
				block.instance.find(`value_${args[0].value}`) || BirUtil.generateInt(-1)
			);
		} else {
			return BirUtil.generateInt(-1);
		}
	}

	// static async ScopeInput(
	// 	engine: BirEngine,
	// 	args: Bir.IntPrimitiveExpression[]
	// ): Promise<Bir.IntPrimitiveExpression> {
	// 	if (args[0].value === 1) {
	// 		let input = prompt("") || "";
	// 		let encoder = new TextEncoder();
	// 		// const buf = new Uint8Array(1024);

	// 		// // Write question to console
	// 		// await stdout.write(new TextEncoder().encode(question));

	// 		// // Read console's input into answer
	// 		// const n = <number>await stdin.read(buf);
	// 		// const answer = new TextDecoder().decode(buf.subarray(0, n));

	// 		// return answer.trim();
	// 		input_buffer = Array.from(encoder.encode(input));
	// 		return BirUtil.generateInt(0);
	// 	} else {
	// 		let char = input_buffer.shift();

	// 		if (char) {
	// 			return BirUtil.generateInt(char);
	// 		} else {
	// 			return BirUtil.generateInt(InterfaceName.Done);
	// 		}
	// 	}
	// }

	static async ScopeOutput(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		if (args[0].value === InterfaceName.Done) {
			await Deno.stdout.write(Uint8Array.from(output_buffer));
			output_buffer = [];
		} else {
			if (args[1]?.value === 1) {
				let split = args[0].value.toString().split("");
				for (let i = 0; i < split.length; i++) {
					output_buffer.push(split[i].charCodeAt(0));
				}
			} else {
				output_buffer.push(args[0].value);
			}
		}
		return BirUtil.generateInt(0);
	}

	static async ScopeDelete(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		let block = null;

		let i = 0;
		for (const stack of engine.callstack) {
			let scope = engine.currentScope.findBlock(stack.name);
			if (scope.block) {
				if (i === 0) {
					block = scope.block;
					break;
				} else {
					i++;
					continue;
				}
			}
		}

		if (block) {
			return (
				block.instance.find(`value_${args[0].value}`) || BirUtil.generateInt(-1)
			);
		} else {
			return BirUtil.generateInt(-1);
		}
	}
}
