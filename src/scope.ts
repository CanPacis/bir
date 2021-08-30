import Bir from "./ast.ts";
import BirEngine from "./engine.ts";

export enum UpdateReport {
	Granted = 0,
	DeniedConst = 1,
	DeniedImmutable = 2,
}

export interface ScopeBlock {
	block:
		| Bir.BlockDeclarationStatement
		| Bir.NativeBlockDeclarationStatement
		| undefined;
	foreign: boolean;
}

export default class Scope {
	immutable: boolean;
	foreign: boolean;
	frame: Array<{
		key: Bir.Identifier;
		value: Bir.IntPrimitiveExpression;
		kind: Bir.VariableKind;
	}>;

	blocks: Array<
		Bir.BlockDeclarationStatement | Bir.NativeBlockDeclarationStatement
	>;

	constructor(public parents: Array<Scope> = []) {
		this.frame = [];
		this.blocks = [];
		this.immutable = false;
		this.foreign = false;
	}

	push(
		key: Bir.Identifier,
		value: Bir.IntPrimitiveExpression,
		kind: Bir.VariableKind
	): void {
		this.frame.push({ key, value, kind });
	}

	find(name: string): Bir.IntPrimitiveExpression | undefined {
		let value = this.frame.find((d) => d.key.value === name)?.value;

		if (!value) {
			for (const parent of this.parents) {
				let supValue = parent.find(name);
				if (supValue) {
					value = supValue;
					break;
				}
			}

			return value;
		} else {
			return value;
		}
	}

	async update(
		name: string,
		value: Bir.IntPrimitiveExpression
	): Promise<UpdateReport> {
		let i = this.frame.findIndex((d) => d.key.value === name);

		if (i < 0) {
			let valid = 0;
			for await (const parent of this.parents) {
				let v = await parent.update(name, value);
				if (v) valid = 0;
			}

			return valid;
		} else {
			if (this.frame[i].kind === "const") {
				return 1;
			} else {
				if (this.immutable) {
					return 2;
				} else {
					this.frame[i].value = value;
					return 0;
				}
			}
		}
	}

	addBlock(
		block: Bir.BlockDeclarationStatement | Bir.NativeBlockDeclarationStatement
	): void {
		this.blocks.push(block);
	}

	findBlock(
		name: string
	): ScopeBlock {
		let _name = name[0] === "$" ? name.substr(1) : name
		let value = this.blocks.find((b) => b.name.value === _name);
		let result: ScopeBlock = { block: value, foreign: false }

		if (!value) {
			for (const parent of this.parents) {
				let supValue = parent.findBlock(_name);
				if (supValue.block) {
					result = supValue;
					break;
				}
			}

			return result
		} else {
			if (this.foreign) result.foreign = true
			return result
		}
	}

	async flagBlockAsInitialized(
		name: string,
		instance: Scope
	): Promise<boolean> {
		let i = this.blocks.findIndex((d) => d.name.value === name);

		if (i < 0) {
			let valid = false;
			for await (const parent of this.parents) {
				let v = await parent.flagBlockAsInitialized(name, instance);
				if (v) valid = true;
			}

			return valid;
		} else {
			this.blocks[i].initialized = true;
			this.blocks[i].instance = instance;
			return true;
		}
	}
}
