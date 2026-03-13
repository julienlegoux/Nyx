import { describe, expect, test } from "bun:test";
import { createSkillEntity } from "@nyx/domain/entities/skill.entity.ts";
import { SkillStatus, SkillType } from "@nyx/domain/types/skill.type.ts";

describe("SkillEntity factory", () => {
	const validParams = {
		name: "greet",
		description: "Greeting skill",
		type: SkillType.System,
		path: "/skills/greet.md",
		status: SkillStatus.Active,
		content: "# Greet\nSay hello",
	};

	test("creates entity from valid params", () => {
		const result = createSkillEntity({ ...validParams });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.name).toBe("greet");
			expect(result.value.type).toBe(SkillType.System);
			expect(result.value.content).toBe("# Greet\nSay hello");
		}
	});

	test("creates entity with Self skill type", () => {
		const result = createSkillEntity({
			...validParams,
			type: SkillType.Self,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SkillType.Self);
		}
	});

	test("creates entity with Proto skill type", () => {
		const result = createSkillEntity({
			...validParams,
			type: SkillType.Proto,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SkillType.Proto);
		}
	});

	test("creates entity with Draft status", () => {
		const result = createSkillEntity({
			...validParams,
			status: SkillStatus.Draft,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.status).toBe(SkillStatus.Draft);
		}
	});

	test("rejects empty name", () => {
		const result = createSkillEntity({
			...validParams,
			name: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("name");
		}
	});

	test("rejects empty description", () => {
		const result = createSkillEntity({
			...validParams,
			description: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("description");
		}
	});

	test("rejects empty path", () => {
		const result = createSkillEntity({
			...validParams,
			path: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("path");
		}
	});

	test("rejects empty content", () => {
		const result = createSkillEntity({
			...validParams,
			content: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("content");
		}
	});

	test("rejects whitespace-only name", () => {
		const result = createSkillEntity({ ...validParams, name: "   " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("name");
		}
	});

	test("rejects whitespace-only description", () => {
		const result = createSkillEntity({ ...validParams, description: "  \t " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("description");
		}
	});

	test("rejects whitespace-only path", () => {
		const result = createSkillEntity({ ...validParams, path: "   " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("path");
		}
	});

	test("rejects whitespace-only content", () => {
		const result = createSkillEntity({ ...validParams, content: " \n " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("content");
		}
	});

	test("returns a new object, not the input reference", () => {
		const params = { ...validParams };
		const result = createSkillEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBe(params);
		}
	});

	test("mutations to input do not affect entity", () => {
		const params = { ...validParams };
		const result = createSkillEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			params.name = "mutated";
			expect(result.value.name).toBe("greet");
		}
	});
});
