compile-grammar:
	nearleyc src/parser/grammar.ne -o src/parser/parser.ts

run-engine:
	deno run -A src/main.ts "C:\\Users\\tmwwd\\IdeaProjects\\bir\\test\\test.bir"

compile-and-run:
	nearleyc src/parser/grammar.ne -o src/parser/parser.ts && deno run -A src/main.ts "C:\\Users\\tmwwd\\IdeaProjects\\bir\\test\\test.bir"