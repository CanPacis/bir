// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var ConditionSign: any;
declare var Comment: any;
declare var NumberLiteral: any;
declare var BinaryLiteral: any;
declare var HexLiteral: any;
declare var OctalLiteral: any;
declare var StringLiteral: any;
declare var Identifier: any;


import m from "https://dev.jspm.io/moo"
import n from "https://dev.jspm.io/nearley";

const nearley = n as Nearley;
const moo = m as { compile: Function; keywords: Function }

interface Nearley {
  Parser: { new (grammar: any): any };
  Grammar: { fromCompiled: (grammar: Grammar) => any };
  Rule: { new (): any };
}

export class BirParser {
  parser: any;

  constructor() {
    this.parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  }

  parse(input: string) {
    this.parser.feed(input);

    if (this.parser.results.length > 1) {
      console.error("Grammar is ambigious.");
    }

    return this.parser.results[0];
  }
}

const lexer = moo.compile({
  WhiteSpace: { match: /[ \t\n\r]+/, lineBreaks: true },
  NumberLiteral: {
    match: /-?[0-9]+(?:\.[0-9]+)?/,
  },
  BinaryLiteral: {
    match: /-?@b[0-1]+/
  },
  HexLiteral: {
    match: /-?@x[0-9a-fA-F]+/
  },
  OctalLiteral: {
    match: /-?@o[0-7]+/
  },
  Dot: ".",
  Colon: ":",
  Comma: ",",
  LeftParens: "(",
  RightParens: ")",
  LeftCurlyBrackets: "{",
  RightCurlyBrackets: "}",
  LeftBrackets: "[",
  RightBrackets: "]",
  Plus: "+",
  Multiplier: "*",
  QuestionMark: "?",
  Caret: "^",
  Apostrophe: "'",
  Percent: "%",
  ConditionSign: {
    match: /!?(?:&&|\|\||<=|>=|<|>|==)/,
  },
  Ampersand: "&",
  EqualsTo: "=",
	Pound: "#",
  StringLiteral: {
    match: /"(?:[^\n\\"]|\\["\\ntbfr])*"/,
    value: (s: string) => JSON.parse(s)
  },
	Comment: {
    match: /#[^\n]*/,
    value: (s: string) => s
  },
  Divider: "/",
  Identifier: {
    match: /-?[a-zA-Z_][a-zA-Z_0-9]*/,
    type: moo.keywords({
      Use: "use",
      Const: "const",
      Let: "let",
      Init: "init",
      Return: "return",
      Throw: "throw",
			Debugger: "debugger",
			Implements: "implements",
  		If: "if",
      Elif: "elif",
      Else: "else",
  		Switch: "switch",
  		Default: "default",
  		For: "for",
  		While: "while",
  		As: "as",
      Case: "case",
      Log: "log"
    })
  },
  Minus: "-"
})

function getCondition(condition: string) {
  switch(condition) {
    case "&&":
      return "and";
    case "||":
      return "or";
    case "<":
      return "less_than";
    case ">":
      return "greater_than";
    case "<=":
      return "less_than_equals";
    case ">=":
      return "greater_than_equals";
    case "==":
      return "equals";
    case "!&&":
      return "nand";
    case "!||":
      return "nor";
    case "!<":
      return "not_less_than";
    case "!>":
      return "not_greater_than";
    case "!<=":
      return "not_less_than_equals";
    case "!>=":
      return "not_greater_than_equals";
    case "!==":
      return "not_equals";
  }
}

function arithmetic(type: any, data: any) {
  return { 
    operation: "arithmetic", 
    type, 
    left: data[0], 
    right: data[4] || { type: "int", value: 0, operation: "primitive", position: { col: 0, line: 0 } }, 
    position: data[0].position 
  }
}

function position(data: any) {
  return { line: data.line, col: data.col }
}


interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "Program$ebnf$1", "symbols": []},
    {"name": "Program$ebnf$1$subexpression$1", "symbols": ["Use", "_"], "postprocess": id},
    {"name": "Program$ebnf$1", "symbols": ["Program$ebnf$1", "Program$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Program$ebnf$2", "symbols": []},
    {"name": "Program$ebnf$2$subexpression$1", "symbols": ["Main", "_"], "postprocess": id},
    {"name": "Program$ebnf$2", "symbols": ["Program$ebnf$2", "Program$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Program", "symbols": ["_", "Program$ebnf$1", "Program$ebnf$2"], "postprocess": d => ({ imports: d[1], program: d[2] })},
    {"name": "Use", "symbols": [{"literal":"use"}, "__", "string"], "postprocess":  d => ({ 
          source: d[2],
          position: position(d[0])
        }) },
    {"name": "Main", "symbols": ["Statement"], "postprocess": id},
    {"name": "Main", "symbols": ["BlockCall"], "postprocess": id},
    {"name": "Main", "symbols": ["Comment"], "postprocess": id},
    {"name": "Statement", "symbols": ["VariableDeclarationStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["BlockDeclarationStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["SwitchStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["IfStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ReturnStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ThrowStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["AssignStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["QuantityModifierStatement"], "postprocess": id},
    {"name": "VariableDeclarationStatement$subexpression$1", "symbols": [{"literal":"const"}], "postprocess": id},
    {"name": "VariableDeclarationStatement$subexpression$1", "symbols": [{"literal":"let"}], "postprocess": id},
    {"name": "VariableDeclarationStatement", "symbols": ["VariableDeclarationStatement$subexpression$1", "__", "identifier", "_", {"literal":"="}, "_", "Expression"], "postprocess": d => ({ operation: "variable_declaration", kind: d[0].value, left: d[2], right: d[6], position: { line: d[0].line, col: d[0].col } })},
    {"name": "SwitchStatement$ebnf$1", "symbols": []},
    {"name": "SwitchStatement$ebnf$1$subexpression$1", "symbols": [{"literal":"case"}, "__", "Expression", "_", "CodeBlock", "_"], "postprocess": d => ({ case: d[2], body: d[4] })},
    {"name": "SwitchStatement$ebnf$1", "symbols": ["SwitchStatement$ebnf$1", "SwitchStatement$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "SwitchStatement$ebnf$2$subexpression$1", "symbols": [{"literal":"default"}, "_", "CodeBlock", "_"], "postprocess": d => ({ body: d[2] })},
    {"name": "SwitchStatement$ebnf$2", "symbols": ["SwitchStatement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "SwitchStatement$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "SwitchStatement", "symbols": [{"literal":"switch"}, "__", "Expression", "_", {"literal":"{"}, "_", "SwitchStatement$ebnf$1", "SwitchStatement$ebnf$2", {"literal":"}"}], "postprocess":  d => ({ 
          operation: "switch_statement", 
          condition: d[2],
          cases: d[6],
          default: d[7],
          position: position(d[0])
        }) },
    {"name": "ForStatement", "symbols": [{"literal":"for"}, "__", "Expression", "__", {"literal":"as"}, "__", "identifier", "_", "CodeBlock"], "postprocess":  d => ({ 
          operation: "for_statement", 
          statement: d[2], 
          placeholder: d[6].value, 
          body: d[8],
          position: position(d[0]) 
        }) },
    {"name": "WhileStatement", "symbols": [{"literal":"while"}, "__", "Expression", "_", "CodeBlock"], "postprocess":  d => ({ 
          operation: "while_statement", 
          statement: d[2], 
          body: d[4],
          position: position(d[0]) 
        }) },
    {"name": "IfStatement$ebnf$1", "symbols": []},
    {"name": "IfStatement$ebnf$1$subexpression$1", "symbols": ["_", {"literal":"elif"}, "__", "Expression", "_", "CodeBlock"], "postprocess": d => ({ condition: d[3], body: d[5] })},
    {"name": "IfStatement$ebnf$1", "symbols": ["IfStatement$ebnf$1", "IfStatement$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "IfStatement$ebnf$2$subexpression$1", "symbols": ["_", {"literal":"else"}, "_", "CodeBlock"], "postprocess": d => d[3]},
    {"name": "IfStatement$ebnf$2", "symbols": ["IfStatement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "IfStatement$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "IfStatement", "symbols": [{"literal":"if"}, "__", "Expression", "_", "CodeBlock", "IfStatement$ebnf$1", "IfStatement$ebnf$2"], "postprocess":  d => ({ 
          operation: "if_statement", 
          condition: d[2], 
          body: d[4],
          elifs: d[5],
          else: d[6],
          position: position(d[0])
        }) },
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", {"literal":"+"}, {"literal":"+"}], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "increment", statement: d[0], position: d[0].position })},
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", {"literal":"-"}, {"literal":"-"}], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "decrement", statement: d[0], position: d[0].position })},
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", "_", {"literal":"+"}, {"literal":"="}, "_", "Expression"], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "add", statement: d[0], right: d[5], position: d[0].position })},
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", "_", {"literal":"-"}, {"literal":"="}, "_", "Expression"], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "subtract", statement: d[0], right: d[5], position: d[0].position })},
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", "_", {"literal":"*"}, {"literal":"="}, "_", "Expression"], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "multiply", statement: d[0], right: d[5], position: d[0].position })},
    {"name": "QuantityModifierStatement", "symbols": ["Mutatable", "_", {"literal":"/"}, {"literal":"="}, "_", "Expression"], "postprocess": d => ({ operation: "quantity_modifier_statement", type: "divide", statement: d[0], right: d[5], position: d[0].position })},
    {"name": "AssignStatement", "symbols": ["Mutatable", "_", {"literal":"="}, "_", "Expression"], "postprocess":  d => ({ 
          operation: "assign_statement", 
          left: d[0], 
          right: d[4],
          position: d[0].position 
        }) },
    {"name": "ReturnStatement", "symbols": [{"literal":"return"}, "__", "Expression"], "postprocess": d => ({ operation: "return_statement", expression: d[2], position: position(d[0]) })},
    {"name": "ThrowStatement", "symbols": [{"literal":"throw"}, "__", "Expression"], "postprocess": d => ({ operation: "throw_statement", expression: d[2], position: position(d[0]) })},
    {"name": "BlockDeclarationStatement$ebnf$1", "symbols": []},
    {"name": "BlockDeclarationStatement$ebnf$1", "symbols": ["BlockDeclarationStatement$ebnf$1", "BlockVerb"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockDeclarationStatement$ebnf$2$subexpression$1", "symbols": ["ArgumentList", "_"], "postprocess": id},
    {"name": "BlockDeclarationStatement$ebnf$2", "symbols": ["BlockDeclarationStatement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "BlockDeclarationStatement$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "BlockDeclarationStatement", "symbols": ["identifier", "BlockDeclarationStatement$ebnf$1", "__", {"literal":"["}, "_", "BlockDeclarationStatement$ebnf$2", {"literal":"]"}, "_", "BlockContent"], "postprocess": d => ({ operation: "block_declaration", name: d[0], verbs: d[1], arguments: d[5], body: d[8], position: d[0].position, implementing: false, initialized: false })},
    {"name": "BlockDeclarationStatement$ebnf$3$subexpression$1$subexpression$1", "symbols": ["string"], "postprocess": id},
    {"name": "BlockDeclarationStatement$ebnf$3$subexpression$1$subexpression$1", "symbols": ["array"], "postprocess": id},
    {"name": "BlockDeclarationStatement$ebnf$3$subexpression$1", "symbols": ["__", {"literal":"{"}, "_", "BlockDeclarationStatement$ebnf$3$subexpression$1$subexpression$1", "_", {"literal":"}"}], "postprocess": d => d[3]},
    {"name": "BlockDeclarationStatement$ebnf$3", "symbols": ["BlockDeclarationStatement$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "BlockDeclarationStatement$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "BlockDeclarationStatement", "symbols": ["identifier", "_", {"literal":"implements"}, "_", "identifier", "BlockDeclarationStatement$ebnf$3"], "postprocess": d => ({ operation: "block_declaration", name: d[0], implements: d[4], position: d[0].position, implementing: true, populate: d[5], initialized: false })},
    {"name": "BlockVerb", "symbols": [{"literal":":"}, "Expression"], "postprocess": d => d[1]},
    {"name": "BlockContent$ebnf$1$subexpression$1", "symbols": ["BlockInit", "_"], "postprocess": id},
    {"name": "BlockContent$ebnf$1", "symbols": ["BlockContent$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "BlockContent$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "BlockContent$ebnf$2", "symbols": []},
    {"name": "BlockContent$ebnf$2$subexpression$1", "symbols": ["Main", "_"], "postprocess": id},
    {"name": "BlockContent$ebnf$2", "symbols": ["BlockContent$ebnf$2", "BlockContent$ebnf$2$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockContent", "symbols": [{"literal":"{"}, "_", "BlockContent$ebnf$1", "BlockContent$ebnf$2", {"literal":"}"}], "postprocess": d => ({ init: d[2], program: d[3] })},
    {"name": "BlockInit$ebnf$1", "symbols": []},
    {"name": "BlockInit$ebnf$1$subexpression$1", "symbols": ["Main", "_"], "postprocess": id},
    {"name": "BlockInit$ebnf$1", "symbols": ["BlockInit$ebnf$1", "BlockInit$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockInit", "symbols": [{"literal":"init"}, "_", {"literal":"{"}, "_", "BlockInit$ebnf$1", {"literal":"}"}], "postprocess": d => d[4]},
    {"name": "Expression", "symbols": ["Conditions"], "postprocess": id},
    {"name": "Expression", "symbols": ["Arithmetic"], "postprocess": id},
    {"name": "Arithmetic", "symbols": ["Arithmetic", "_", {"literal":"+"}, "_", "MultDiv"], "postprocess": d => arithmetic("addition", d)},
    {"name": "Arithmetic", "symbols": ["Arithmetic", "_", {"literal":"-"}, "_", "MultDiv"], "postprocess": d => arithmetic("subtraction", d)},
    {"name": "Arithmetic", "symbols": ["MultDiv"], "postprocess": id},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", {"literal":"*"}, "_", "Exponent"], "postprocess": d => arithmetic("multiplication", d)},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", {"literal":"/"}, "_", "Exponent"], "postprocess": d => arithmetic("division", d)},
    {"name": "MultDiv", "symbols": ["Exponent"], "postprocess": id},
    {"name": "Exponent", "symbols": ["Caller", "_", {"literal":"^"}, "_", "Exponent"], "postprocess": d => arithmetic("exponent", d)},
    {"name": "Exponent", "symbols": ["Caller", "_", {"literal":"'"}, "_", "Exponent"], "postprocess": d => arithmetic("root", d)},
    {"name": "Exponent", "symbols": ["Caller", "_", {"literal":"%"}, "_", "Exponent"], "postprocess": d => arithmetic("modulus", d)},
    {"name": "Exponent", "symbols": ["Caller", "_", {"literal":"log"}], "postprocess": d => arithmetic("log10", d)},
    {"name": "Exponent", "symbols": ["Caller"], "postprocess": id},
    {"name": "Caller", "symbols": ["BlockCall"], "postprocess": id},
    {"name": "Caller", "symbols": ["SubExpression"], "postprocess": id},
    {"name": "BlockCall$ebnf$1", "symbols": []},
    {"name": "BlockCall$ebnf$1", "symbols": ["BlockCall$ebnf$1", "BlockVerb"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "BlockCall$ebnf$2$subexpression$1", "symbols": ["ArgumentList", "_"], "postprocess": id},
    {"name": "BlockCall$ebnf$2", "symbols": ["BlockCall$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "BlockCall$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "BlockCall", "symbols": ["Caller", "BlockCall$ebnf$1", "_", {"literal":"("}, "_", "BlockCall$ebnf$2", {"literal":")"}], "postprocess":  d => ({ 
          operation: "block_call", 
          name: d[0], 
          verbs: d[1],
          arguments: d[5] || [],
          position: d[0].position
        }) },
    {"name": "Conditions", "symbols": ["Expression", "_", (lexer.has("ConditionSign") ? {type: "ConditionSign"} : ConditionSign), "_", "Arithmetic"], "postprocess":  d => ({ 
          operation: "condition", 
          type: getCondition(d[2].value), 
          left: d[0], 
          right: d[4],
          position: d[0].position 
        }) },
    {"name": "SubExpression", "symbols": ["Primitive"], "postprocess": id},
    {"name": "SubExpression", "symbols": ["VariableReference"], "postprocess": id},
    {"name": "SubExpression", "symbols": ["Grouping"], "postprocess": id},
    {"name": "ArgumentList", "symbols": ["Expression", "_", {"literal":","}, "_", "ArgumentList"], "postprocess": d => [d[0], ...d[4]]},
    {"name": "ArgumentList", "symbols": ["Expression"], "postprocess": d => [d[0]]},
    {"name": "Grouping", "symbols": [{"literal":"{"}, "Expression", {"literal":"}"}], "postprocess": d => d[1]},
    {"name": "VariableReference", "symbols": ["identifier"], "postprocess":  d => ({ 
          operation: "reference", 
          value: d[0].value,
          negative: d[0].negative,
          position: { line: d[0].position.line, col: d[0].position.col }
        }) },
    {"name": "Primitive", "symbols": ["number"], "postprocess": id},
    {"name": "Comment", "symbols": [(lexer.has("Comment") ? {type: "Comment"} : Comment)], "postprocess":  d => ({ 
          operation: "comment", 
          value: d[0].value,
          position: position(d[0])
        }) },
    {"name": "CodeBlock$ebnf$1", "symbols": []},
    {"name": "CodeBlock$ebnf$1$subexpression$1", "symbols": ["Main", "_"], "postprocess": id},
    {"name": "CodeBlock$ebnf$1", "symbols": ["CodeBlock$ebnf$1", "CodeBlock$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "CodeBlock", "symbols": [{"literal":"{"}, "_", "CodeBlock$ebnf$1", {"literal":"}"}], "postprocess": d => d[2]},
    {"name": "Mutatable", "symbols": ["VariableReference"], "postprocess": id},
    {"name": "NumberList", "symbols": ["number", "_", {"literal":","}, "_", "NumberList"], "postprocess": d => [d[0], ...d[4]]},
    {"name": "NumberList", "symbols": ["number"], "postprocess": d => [d[0]]},
    {"name": "array$ebnf$1$subexpression$1", "symbols": ["NumberList", "_"], "postprocess": id},
    {"name": "array$ebnf$1", "symbols": ["array$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "array$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "array", "symbols": [{"literal":"["}, "array$ebnf$1", {"literal":"]"}], "postprocess":  d => ({
          operation: "primitive",
          type: "array", 
          values: d[1]?.flat(Number.POSITIVE_INFINITY) || [],
          position: { line: d[0].line, col: d[0].col }
        }) },
    {"name": "number", "symbols": [(lexer.has("NumberLiteral") ? {type: "NumberLiteral"} : NumberLiteral)], "postprocess":  d => ({ 
          operation: "primitive",
          value: parseInt(d[0].value, 10),
          type: "int",
          position: position(d[0])
        })  },
    {"name": "number", "symbols": [(lexer.has("BinaryLiteral") ? {type: "BinaryLiteral"} : BinaryLiteral)], "postprocess":  d => ({ 
          operation: "primitive",
          value: d[0].value[0] === "-" ? -(parseInt(d[0].value.substr(3), 2)) : parseInt(d[0].value.substr(2), 2),
          type: "int",
          position: position(d[0])
        })  },
    {"name": "number", "symbols": [(lexer.has("HexLiteral") ? {type: "HexLiteral"} : HexLiteral)], "postprocess":  d => ({ 
          operation: "primitive",
          value: d[0].value[0] === "-" ? -(parseInt(d[0].value.substr(3), 16)) : parseInt(d[0].value.substr(2), 16),
          type: "int",
          position: position(d[0])
        })  },
    {"name": "number", "symbols": [(lexer.has("OctalLiteral") ? {type: "OctalLiteral"} : OctalLiteral)], "postprocess":  d => ({ 
          operation: "primitive",
          value: d[0].value[0] === "-" ? -(parseInt(d[0].value.substr(3), 8)) : parseInt(d[0].value.substr(2), 8),
          type: "int",
          position: position(d[0])
        })  },
    {"name": "string", "symbols": [(lexer.has("StringLiteral") ? {type: "StringLiteral"} : StringLiteral)], "postprocess": d => ({ operation: "primitive", value: d[0].value,position: position(d[0]), type: "string" })},
    {"name": "identifier", "symbols": [(lexer.has("Identifier") ? {type: "Identifier"} : Identifier)], "postprocess": d => ({ negative: d[0].value[0] === "-", operation: "identifier", value: d[0].value[0] === "-" ? d[0].value.substr(1) : d[0].value, position: { line: d[0].line, col: d[0].col } })},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": (d) =>  null},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", /[\s]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": (d) =>  null}
  ],
  ParserStart: "Program",
};

export default grammar;
