import { describe, expect, test } from "bun:test";
import { createSkillEntity } from "@nyx/domain/entities/skill.entity.ts";
import { SkillStatus, SkillType } from "@nyx/domain/types/skill.type.ts";

describe("SkillEntity factory", () => {
	test("creates entity from valid params", () => {
		const result = createSkillEntity({
			name: "greet",
			description: "Greeting skill",
			type: SkillType.System,
			path: "/skills/greet.md",
			status: SkillStatus.Active,
			content: "# Greet\nSay hello",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.name).toBe("greet");
			expect(result.value.type).toBe(SkillType.System);
			expect(result.value.content).toBe("# Greet\nSay hello");
		}
	});

	test("rejects empty name", () => {
		const result = createSkillEntity({
			name: "",
			description: "Greeting skill",
			type: SkillType.System,
			path: "/skills/greet.md",
			status: SkillStatus.Active,
			content: "# Greet\nSay hello",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("name");
		}
	});

	test("rejects empty path", () => {
		const result = createSkillEntity({
			name: "greet",
			description: "Greeting skill",
			type: SkillType.System,
			path: "",
			status: SkillStatus.Active,
			content: "# Greet\nSay hello",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("path");
		}
	});
});
