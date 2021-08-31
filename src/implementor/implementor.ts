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
	Delete = 4206912,
	Pull = 4206913,
}

let input_buffer = new BirUtil.IOBuffer();
let output_buffer = new BirUtil.IOBuffer();

export default class Implementor {
	static Interface = (engine: BirEngine) =>
		BirUtil.generateFunction(
			"bir",
			engine.id,
			async (
				engine: BirEngine,
				verbs: Bir.IntPrimitiveExpression[],
				args: Bir.IntPrimitiveExpression[]
			) => {
				switch (verbs[0].value) {
					// case InterfaceName.Read:
					// 	return await Implementor.ScopeRead(engine, args);
					case InterfaceName.Push:
						return await Implementor.Push(args);
					case InterfaceName.Pull:
						return await Implementor.Pull(args);
					// case InterfaceName.Assign:
					// 	return await Implementor.ScopeAssign(engine, args);
					case InterfaceName.Input:
						return await Implementor.Input(args);
					case InterfaceName.Output:
						return await Implementor.Output(args);
					default:
						return BirUtil.generateInt(0);
				}
			}
		);

	// static async Write(): Promise<Bir.IntPrimitiveExpression> {

	// }

	static async Input(
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		const buf = new Uint8Array(1024);

		await Deno.stdout.write(new TextEncoder().encode(""));
		const n = <number>await Deno.stdin.read(buf);

		input_buffer.assign(buf.subarray(0, n));
		input_buffer.trim();
		return BirUtil.generateInt(0);
	}

	static async Output(
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		await Deno.stdout.write(output_buffer.uint8Array());
		output_buffer.clear();

		return args[0] || BirUtil.generateInt(0);
	}

	static async Push(
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		output_buffer.push(args[0].value);

		return args[0] || BirUtil.generateInt(0);
	}

	static async Pull(
		args: Bir.IntPrimitiveExpression[]
	): Promise<Bir.IntPrimitiveExpression> {
		let char = input_buffer.shift();

		if (char) {
			return BirUtil.generateInt(char);
		} else {
			return BirUtil.generateInt(InterfaceName.Done);
		}
	}
}
