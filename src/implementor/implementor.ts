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
}

export default class Implementor {
	static Interface = BirUtil.generateFunction(
		"__implementor_interface__",
		(
			engine: BirEngine,
			verbs: Bir.IntPrimitiveExpression[],
			args: Bir.IntPrimitiveExpression[]
		) => {
			switch (verbs[0].value) {
				case InterfaceName.Read:
					return Implementor.ScopeRead(engine, args);
				case InterfaceName.Push:
					return Implementor.ScopePush(engine, args);
				case InterfaceName.Assign:
					return Implementor.ScopeAssign(engine, args);
				default:
					return BirUtil.generateInt(0);
			}
		}
	);

	static ScopeRead(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Bir.IntPrimitiveExpression {
		let name = engine.callstack[engine.callstack.length - 1 - args[1].value].name
		let block = engine.currentScope.findBlock(name)

		return block?.instance.find(`value_${args[0].value}`) || BirUtil.generateInt(-1);
	}

	static ScopePush(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Bir.IntPrimitiveExpression {
		let name = engine.callstack[engine.callstack.length - 1 - args[2].value].name
		let block = engine.currentScope.findBlock(name)

		block?.instance.push(BirUtil.generateIdentifier(`value_${args[0].value}`), args[1], "let")
		return BirUtil.generateInt(0);
	}

	static ScopeAssign(
		engine: BirEngine,
		args: Bir.IntPrimitiveExpression[]
	): Bir.IntPrimitiveExpression {
		return BirUtil.generateInt(0);
	}
}
