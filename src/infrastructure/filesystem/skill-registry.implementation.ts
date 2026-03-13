import { rename } from "node:fs/promises";
import path from "node:path";
import { SkillRegistryError } from "@nyx/domain/errors/index.ts";
import type { SkillRegistry } from "@nyx/domain/ports/index.ts";
import { type Skill, SkillStatus, SkillType } from "@nyx/domain/types/index.ts";
import type { Result } from "@nyx/domain/types/index.ts";

interface RawSkillEntry {
	name: string;
	description: string;
	type: string;
	path: string;
	status: string;
}

const typeFromJson: Record<string, SkillType> = {
	system: SkillType.System,
	self: SkillType.Self,
	proto: SkillType.Proto,
};

const statusFromJson: Record<string, SkillStatus> = {
	active: SkillStatus.Active,
	draft: SkillStatus.Draft,
};

function mapToDomain(raw: RawSkillEntry): Skill {
	const skillType = typeFromJson[raw.type];
	if (skillType === undefined) {
		throw new SkillRegistryError(`Unknown skill type: ${raw.type}`);
	}
	const skillStatus = statusFromJson[raw.status];
	if (skillStatus === undefined) {
		throw new SkillRegistryError(`Unknown skill status: ${raw.status}`);
	}
	return {
		name: raw.name,
		description: raw.description,
		type: skillType,
		path: raw.path,
		status: skillStatus,
	};
}

function typeToJsonString(type: SkillType): string {
	switch (type) {
		case SkillType.System:
			return "system";
		case SkillType.Self:
			return "self";
		case SkillType.Proto:
			return "proto";
	}
}

function statusToJsonString(status: SkillStatus): string {
	switch (status) {
		case SkillStatus.Active:
			return "active";
		case SkillStatus.Draft:
			return "draft";
	}
}

function mapToJson(skill: Skill): RawSkillEntry {
	return {
		name: skill.name,
		description: skill.description,
		type: typeToJsonString(skill.type),
		path: skill.path,
		status: statusToJsonString(skill.status),
	};
}

function containsPathTraversal(filePath: string): boolean {
	if (filePath.includes("\\")) {
		return true;
	}
	const normalized = path.posix.normalize(filePath);
	return normalized.startsWith("..") || normalized.includes("/..");
}

export class SkillRegistryImpl implements SkillRegistry {
	private readonly skillsDir: string;
	private readonly indexPath: string;

	constructor(homePath: string) {
		this.skillsDir = path.join(homePath, "skills");
		this.indexPath = path.join(this.skillsDir, "skill-index.json");
	}

	async listSkills(): Promise<Result<Skill[]>> {
		try {
			const file = Bun.file(this.indexPath);
			const exists = await file.exists();
			if (!exists) {
				return {
					ok: false,
					error: new SkillRegistryError(`Skill index not found: ${this.indexPath}`),
				};
			}
			const raw: RawSkillEntry[] = await file.json();
			const skills = raw.map(mapToDomain);
			return { ok: true, value: skills };
		} catch (error) {
			return {
				ok: false,
				error: new SkillRegistryError(
					`Failed to read skill index: ${error instanceof Error ? error.message : String(error)}`,
				),
			};
		}
	}

	async loadSkill(skillPath: string): Promise<Result<string>> {
		if (containsPathTraversal(skillPath)) {
			return {
				ok: false,
				error: new SkillRegistryError(
					`Invalid skill path: path traversal not allowed: ${skillPath}`,
				),
			};
		}

		try {
			const fullPath = path.join(this.skillsDir, skillPath);
			const file = Bun.file(fullPath);
			const exists = await file.exists();
			if (!exists) {
				return {
					ok: false,
					error: new SkillRegistryError(`Skill file not found: ${skillPath}`),
				};
			}
			const content = await file.text();
			return { ok: true, value: content };
		} catch (error) {
			return {
				ok: false,
				error: new SkillRegistryError(
					`Failed to load skill: ${error instanceof Error ? error.message : String(error)}`,
				),
			};
		}
	}

	async registerSkill(skill: Skill): Promise<Result<void>> {
		try {
			const listResult = await this.listSkills();
			if (!listResult.ok) {
				return { ok: false, error: listResult.error };
			}

			const existing = listResult.value.find((s) => s.name === skill.name);
			if (existing) {
				return {
					ok: false,
					error: new SkillRegistryError(`Skill "${skill.name}" already exists in index`),
				};
			}

			const rawEntries = listResult.value.map(mapToJson);
			rawEntries.push(mapToJson(skill));

			const tmpPath = `${this.indexPath}.tmp`;
			await Bun.write(tmpPath, JSON.stringify(rawEntries, null, "\t"));
			await rename(tmpPath, this.indexPath);

			return { ok: true, value: undefined };
		} catch (error) {
			return {
				ok: false,
				error: new SkillRegistryError(
					`Failed to register skill: ${error instanceof Error ? error.message : String(error)}`,
				),
			};
		}
	}

	async updateSkillStatus(name: string, status: SkillStatus): Promise<Result<void>> {
		try {
			const listResult = await this.listSkills();
			if (!listResult.ok) {
				return { ok: false, error: listResult.error };
			}

			const idx = listResult.value.findIndex((s) => s.name === name);
			if (idx === -1) {
				return {
					ok: false,
					error: new SkillRegistryError(`Skill "${name}" not found in index`),
				};
			}

			const current = listResult.value[idx];
			if (!current) {
				return {
					ok: false,
					error: new SkillRegistryError(`Skill "${name}" not found in index`),
				};
			}
			listResult.value[idx] = { ...current, status };
			const rawEntries = listResult.value.map(mapToJson);

			const tmpPath = `${this.indexPath}.tmp`;
			await Bun.write(tmpPath, JSON.stringify(rawEntries, null, "\t"));
			await rename(tmpPath, this.indexPath);

			return { ok: true, value: undefined };
		} catch (error) {
			return {
				ok: false,
				error: new SkillRegistryError(
					`Failed to update skill status: ${error instanceof Error ? error.message : String(error)}`,
				),
			};
		}
	}
}
