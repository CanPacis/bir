import BirEngine from "./engine.ts";


let engine = new BirEngine(Deno.args[0]);
await engine.init();
await engine.run();

// console.log(engine.currentScope.blocks[1].instance);
