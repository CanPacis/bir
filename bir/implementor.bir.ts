import BirUtil from "../src/util.ts";

export default class Implementor {
	static EngineInterface = BirUtil.generateFunction(
		"implementor_engine_interface",
		() => {
			console.log("Hello");
			return BirUtil.generateInt(0);
		}
	);
}
