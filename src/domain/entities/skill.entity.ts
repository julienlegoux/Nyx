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
	return { ok: true, value: params };
}
