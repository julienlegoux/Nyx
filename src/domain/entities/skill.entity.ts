import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";
import type { SkillStatus, SkillType } from "../types/skill.type.ts";

export interface SkillEntity {
	name: string;
	description: string;
	type: SkillType;
	path: string;
	status: SkillStatus;
	content: string;
}

export function createSkillEntity(params: {
	name: string;
	description: string;
	type: SkillType;
	path: string;
	status: SkillStatus;
	content: string;
}): Result<SkillEntity> {
	if (!params.name.trim()) {
		return {
			ok: false,
			error: new ValidationError("Skill name must be non-empty"),
		};
	}
	if (!params.description.trim()) {
		return {
			ok: false,
			error: new ValidationError("Skill description must be non-empty"),
		};
	}
	if (!params.path.trim()) {
		return {
			ok: false,
			error: new ValidationError("Skill path must be non-empty"),
		};
	}
	if (!params.content.trim()) {
		return {
			ok: false,
			error: new ValidationError("Skill content must be non-empty"),
		};
	}

	return { ok: true, value: { ...params } };
}
