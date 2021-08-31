import Bir from "./ast.ts";
import BirUtil from "./util.ts";

export interface ErrorReport {
  filename: string
  path: string
  callstack: BirUtil.Callstack[]
  content: string
}

export default class BirError {
	constructor(
		public report: ErrorReport,
		public message: string,
		public position: Bir.Position,
		anonymous: boolean = false
	) {
		console.log(message, `at ${report.filename} ${position.line}:${position.col}\n`);

		if(!anonymous) {
			console.log(this.getSnippet());
			console.log("Callstack:")
			console.log(report.callstack.map(s => `\t-> ${s.name} ()`).join("\n"))
			console.log(`File:\n\t${report.path}`);
		}
		
		Deno.exit(1);
	}

	getSnippet(): string {
		let lines = this.report.content
			.split("\n")
			.slice(this.position.line - 1, this.position.line);

		let caret =
			Array(this.position.col - 1)
				.fill(" ")
				.join("") + "^";
		lines.push(caret);
		let snippet = lines.join("\n");

		return snippet;
	}
}