export enum SkillType {
	System = "System",
	Self = "Self",
	Proto = "Proto",
}

export enum SkillStatus {
	Active = "Active",
	Draft = "Draft",
}

export interface Skill {
	name: string;
	description: string;
	type: SkillType;
	path: string;
	status: SkillStatus;
}
