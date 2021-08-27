import { BirParser } from "./parser/parser.ts";

let parser = new BirParser();
const decoder = new TextDecoder();
let file = decoder.decode(await Deno.readFile("./bir/test.bir"));

const results = parser.parse(file);

for (const result of results) {
  console.log(result);
}
