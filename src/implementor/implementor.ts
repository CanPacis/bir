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
}

let input_buffer: number[] = [];
let output_buffer: number[] = [];

export default class Implementor {
	static Interface = (engine: BirEngine) =>
		BirUtil.generateFunction(
			"__implementor_interface__",
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
					case InterfaceName.Assign:
						return await Implementor.ScopeAssign(engine, args);
					case InterfaceName.Input:
						return await Implementor.ScopeInput(engine, args);
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
		let name =
			engine.callstack[engine.callstack.length - 1 - args[2].value].name;
		let block = engine.currentScope.findBlock(name).block;

		block?.instance.push(
			BirUtil.generateIdentifier(`value_${args[0].value}`),
			args[1],
			"let"
		);
		return BirUtil.generateInt(0);
	}

	static async ScopeRead(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		let name =
			engine.callstack[engine.callstack.length - 1 - args[1].value].name;
		let block = engine.currentScope.findBlock(name).block;

		return (
			block?.instance.find(`value_${args[0].value}`) || BirUtil.generateInt(-1)
		);
	}

	static async ScopeInput(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		if (args[0].value === 1) {
			let input = prompt("") || "";
			let encoder = new TextEncoder();
			input_buffer = Array.from(encoder.encode(input));
			return BirUtil.generateInt(0);
		} else {
			let char = input_buffer.shift();

			if (char) {
				return BirUtil.generateInt(char);
			} else {
				return BirUtil.generateInt(InterfaceName.Done);
			}
		}
	}

	static async ScopeOutput(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		if (args[0].value === InterfaceName.Done) {
			await Deno.stdout.write(Uint8Array.from(output_buffer));
			output_buffer = [];
		} else {
			if (args[1]?.value === 1) {
				let split = args[0].value.toString().split("")
				for (let i = 0; i < split.length; i++) {
					output_buffer.push(split[i].charCodeAt(0));
				}
			} else {
				output_buffer.push(args[0].value);
			}
		}
		return BirUtil.generateInt(0);
	}

	static async ScopeAssign(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		return BirUtil.generateInt(0);
	}
}
