import BirEngine from "./engine.ts";
import BirError, { ErrorReport } from "./error.ts";

if (Deno.args[0]) {
	let engine = new BirEngine(Deno.args[0]);
	await engine.init();
	await engine.run();

	// console.log(engine.currentScope);
} else {
	let report: ErrorReport = {
		filename: "",
		path: "",
		callstack: [],
		content: "",
	};

	new BirError(
		report,
		`Birlang does not support a repl, please provide a .bir file`,
		{ col: 1, line: 1 },
		true
	);
}
