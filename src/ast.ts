export namespace Bir {
	export interface Program {
		imports: [];
		program: Main[];
	}

	export interface UseStatement {
		source: PrimitiveExpression;
		position: Position;
	}

	export type Main = Statement | BlockCallExpression | Comment;

	export type Statement =
		| VariableDeclarationStatement
		| BlockDeclarationStatement
		| ForStatement
		| SwitchStatement
		| WhileStatement
		| IfStatement
		| ReturnStatement
		| AssignStatement
		| QuantityModifierStatement;

	export interface VariableDeclarationStatement {
		operation: "variable_declaration";
		kind: VariableKind;
		left: Identifier;
		right: Expression;
		position: Position;
	}

	export interface BlockDeclarationStatement {
		operation: "block_declaration";
		name: Identifier;
		verbs: Expression[];
		arguments: Expression[];
		body: BlockBody;
		position: Position;
		implementing: boolean;
		implements: Identifier;
	}

	export interface BlockBody {
		init?: Main[];
		program: Main[];
	}

	export interface ForStatement {
		operation: "for_statement";
		statement: Expression;
		placeholder: string;
		body: Main[];
		position: Position;
	}

	export interface SwitchStatement {
		operation: "switch_statement";
		condition: Expression;
		cases: SwitchCase[];
		position: Expression;
	}

	export interface SwitchCase {
		case: Expression;
		body: Main[];
	}

	export interface WhileStatement {
		operation: "while_statement";
		statement: Expression;
		body: Main[];
		position: Position;
	}

	export interface IfStatement {
		operation: "if_statement";
		condition: Expression;
		body: Main[];
		elifs?: Elif[];
		else?: Main[];
		position: Position;
	}

	export interface Elif {
		condition: Expression;
		body: Main[];
	}

	export interface ReturnStatement {
		operation: "return_statement";
		expression: Expression;
		position: Position;
	}

	export interface AssignStatement {
		operation: "assign_statement";
		left: Mutatable;
		right: Expression;
		position: Position;
	}

	export interface QuantityModifierStatement {
		operation: "quantity_modifier_statement";
		type: QuantityModifierType;
		statement: Mutatable;
		position: Position;
	}

	export type Mutatable = Identifier;

	export type QuantityModifierType =
		| "increment"
		| "decrement"
		| "add"
		| "subtract"
		| "multiply"
		| "divide";

	export type VariableKind = "const" | "let";

	export type Expression =
		| ConditionExpression
		| ArithmeticExpression
		| BlockCallExpression
		| PrimitiveExpression;

	export interface ConditionExpression {
		operation: "conditiion";
		type: ConditionType;
		left: Expression;
		right: Expression;
		position: Position;
	}

	export interface ArithmeticExpression {
		operation: "arithmetic";
		type: ArithmeticType;
		left: Expression;
		right: Expression;
		position: Position;
	}

	export interface BlockCallExpression {
		operation: "block_call";
		name: Expression;
		verbs: Expression[];
		arguments: Expression[];
		position: Position;
	}

	export interface PrimitiveExpression {
		operation: "primitive";
		type: PrimitiveType;
		value: string | number;
		position: Position;
	}

	export type PrimitiveType = "string" | "int";

	export type ArithmeticType =
		| "addition"
		| "subtraction"
		| "multiplication"
		| "division"
		| "exponent"
		| "root"
		| "modulus";

	export type ConditionType =
		| "and"
		| "or"
		| "less_than"
		| "greater_than"
		| "less_than_equals"
		| "greater_than_equals"
		| "equals"
		| "nand"
		| "nor"
		| "not_less_than"
		| "not_greater_than"
		| "not_less_than_equals"
		| "not_greater_than_equals"
		| "not_equals";

	export interface Comment {
		operation: "comment";
		value: string;
	}

	export interface Position {
		line: number;
		col: number;
	}

	export interface Identifier {
		operation: "identifier";
		value: string;
		position: Position;
	}
}
