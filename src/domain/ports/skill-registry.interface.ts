import type { Result } from "../types/result.type.ts";
import type { Skill, SkillStatus } from "../types/skill.type.ts";

export interface SkillRegistry {
	listSkills(): Promise<Result<Skill[]>>;
	loadSkill(path: string): Promise<Result<string>>;
	registerSkill(skill: Skill): Promise<Result<void>>;
	updateSkillStatus(name: string, status: SkillStatus): Promise<Result<void>>;
}
