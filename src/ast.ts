import BirEngine from "./engine.ts";
import { Scope } from "./scope.ts";

namespace Bir {
	export interface Program {
		imports: UseStatement[];
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
		| NativeBlockDeclarationStatement
		| ForStatement
		| SwitchStatement
		| WhileStatement
		| IfStatement
		| ReturnStatement
		| ThrowStatement
		| AssignStatement
		| ScopeMutaterExpression
		| QuantityModifierStatement;

	export interface VariableDeclarationStatement {
		operation: "variable_declaration";
		kind: VariableKind;
		left: Identifier;
		right: Expression;
		position: Position;
	}

	export interface BlockDeclarationStatement {
		owner: BirEngine["id"];
		operation: "block_declaration";
		name: Identifier;
		verbs: Identifier[];
		arguments: Identifier[];
		body: BlockBody;
		position: Position;
		implementing: boolean;
		implements: Identifier;
		initialized: boolean;
		populate?: StringPrimitiveExpression | ArrayPrimitiveExpression;
		instance: Scope;
		superInstance: Scope;
	}

	export interface NativeBlockDeclarationStatement {
		owner: BirEngine["id"];
		operation: "native_block_declaration";
		name: Identifier;
		verbs: Identifier[];
		arguments: Identifier[];
		body: (
			engine: any,
			verbs: IntPrimitiveExpression[],
			args: IntPrimitiveExpression[]
		) => Promise<IntPrimitiveExpression>;
		position: Position;
		implementing: boolean;
		implements: Identifier;
		initialized: boolean;
		instance: Scope;
		superInstance: Scope;
		foreign: boolean;
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
		default?: SwitchCase;
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

	export interface ThrowStatement {
		operation: "throw_statement";
		expression: Expression;
		position: Position;
	}

	export interface AssignStatement {
		operation: "assign_statement";
		left: Identifier;
		right: Expression;
		position: Position;
	}

	export interface ScopeMutaterExpression {
		operation: "scope_mutater_expression";
		mutater: MutaterKeyword;
		arguments?: Expression[];
		position: Position;
	}

	export interface QuantityModifierStatement {
		operation: "quantity_modifier_statement";
		type: QuantityModifierType;
		statement: Mutatable;
		right?: Expression;
		position: Position;
	}

	export type Mutatable = Expression;

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
		| ScopeMutaterExpression
		| PrimitiveExpression
		| ReferenceExpression;

	export interface ConditionExpression {
		operation: "condition";
		type: ConditionType;
		left: Expression;
		right: Expression;
		position: Position;
	}

	export interface ReferenceExpression {
		operation: "reference";
		negative: boolean;
		value: string;
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
		name: Identifier;
		verbs: Expression[];
		arguments: Expression[];
		position: Position;
	}

	export type PrimitiveExpression =
		| StringPrimitiveExpression
		| IntPrimitiveExpression;

	export interface StringPrimitiveExpression {
		operation: "primitive";
		type: "string";
		value: string;
		position: Position;
	}

	export interface ArrayPrimitiveExpression {
		operation: "primitive";
		type: "array";
		values: Expression[];
		position: Position;
	}

	export interface IntPrimitiveExpression {
		operation: "primitive";
		type: "int";
		value: number;
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
		| "modulus"
		| "log10";

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
		negative: boolean;
		value: string;
		position: Position;
	}

	export interface MutaterKeyword {
		operation: "identifier";
		negative: boolean;
		value: "Write" | "Read" | "Delete";
		position: Position;
	}
}

export default Bir;
