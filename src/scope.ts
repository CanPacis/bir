import Bir from "./ast.ts";

export default class Scope {
	frame: Array<{
		key: Bir.Identifier;
		value: Bir.IntPrimitiveExpression;
		kind: Bir.VariableKind;
	}>;

	blocks: Array<Bir.BlockDeclarationStatement>;

	constructor(public parents: Array<Scope> = []) {
		this.frame = [];
		this.blocks = [];
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
	): Promise<boolean> {
		let i = this.frame.findIndex((d) => d.key.value === name);

		if (i < 0) {
			let valid = false;
			for await (const parent of this.parents) {
				let v = await parent.update(name, value);
				if (v) valid = true;
			}

			return valid;
		} else {
			if (this.frame[i].kind === "const") {
				return false;
			} else {
				this.frame[i].value = value;
				return true;
			}
		}
	}

	addBlock(block: Bir.BlockDeclarationStatement): void {
		this.blocks.push(block);
	}

	findBlock(name: string): Bir.BlockDeclarationStatement | undefined {
		let value = this.blocks.find((b) => b.name.value === name);

		if (!value) {
			for (const parent of this.parents) {
				let supValue = parent.findBlock(name);
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
