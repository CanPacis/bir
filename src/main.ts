import BirEngine from "./engine.ts"

let engine = new BirEngine("C:\\Users\\tmwwd\\IdeaProjects\\bir\\bir\\test.bir")
await engine.init()
await engine.run()

console.log(engine.currentScope)