import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { SkillRegistryError } from "@nyx/domain/errors/index.ts";
import type { SkillRegistry } from "@nyx/domain/ports/index.ts";
import { SkillStatus, SkillType } from "@nyx/domain/types/index.ts";
import type { Skill } from "@nyx/domain/types/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";

function createTestSkill(overrides: Partial<Skill> = {}): Skill {
	return {
		name: "test-skill",
		description: "A test skill",
		type: SkillType.Self,
		path: "self/test-skill.md",
		status: SkillStatus.Active,
		...overrides,
	};
}

const validIndexContent = JSON.stringify([
	{
		name: "memory-recall",
		description: "Query memories by semantic similarity",
		type: "system",
		path: "system/memory-recall.md",
		status: "active",
	},
	{
		name: "my-skill",
		description: "A self-created skill",
		type: "self",
		path: "self/my-skill.md",
		status: "active",
	},
]);

const skillFileContent = `---
name: memory-recall
description: Query memories by semantic similarity
type: system
version: 0.1.0
---

# Memory Recall

Instructions for memory recall.
`;

describe("SkillRegistryImpl", () => {
	let tempDir: string;
	let registry: SkillRegistry;

	beforeEach(async () => {
		tempDir = await mkdtemp(path.join(tmpdir(), "nyx-test-"));
		const skillsDir = path.join(tempDir, "skills");
		const systemDir = path.join(skillsDir, "system");
		const selfDir = path.join(skillsDir, "self");

		await Bun.write(path.join(skillsDir, "skill-index.json"), validIndexContent);
		await Bun.write(path.join(systemDir, "memory-recall.md"), skillFileContent);
		await Bun.write(
			path.join(selfDir, "my-skill.md"),
			"---\nname: my-skill\ndescription: A self-created skill\ntype: self\nversion: 0.1.0\n---\n\n# My Skill\n",
		);

		registry = new SkillRegistryImpl(tempDir);
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("implements SkillRegistry interface", () => {
		const impl: SkillRegistry = registry;
		expect(typeof impl.listSkills).toBe("function");
		expect(typeof impl.loadSkill).toBe("function");
		expect(typeof impl.registerSkill).toBe("function");
		expect(typeof impl.updateSkillStatus).toBe("function");
	});

	describe("listSkills", () => {
		it("reads valid index and returns Skill array", async () => {
			const result = await registry.listSkills();

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value).toHaveLength(2);
			expect(result.value[0]).toEqual({
				name: "memory-recall",
				description: "Query memories by semantic similarity",
				type: SkillType.System,
				path: "system/memory-recall.md",
				status: SkillStatus.Active,
			});
			expect(result.value[1]).toEqual({
				name: "my-skill",
				description: "A self-created skill",
				type: SkillType.Self,
				path: "self/my-skill.md",
				status: SkillStatus.Active,
			});
		});

		it("returns SkillRegistryError when index file is missing", async () => {
			const emptyDir = await mkdtemp(path.join(tmpdir(), "nyx-empty-"));
			const emptyRegistry = new SkillRegistryImpl(emptyDir);

			const result = await emptyRegistry.listSkills();

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);

			await rm(emptyDir, { recursive: true, force: true });
		});

		it("returns empty array for empty skill index", async () => {
			await Bun.write(path.join(tempDir, "skills", "skill-index.json"), "[]");

			const result = await registry.listSkills();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(0);
		});

		it("returns SkillRegistryError when index contains invalid JSON", async () => {
			await Bun.write(path.join(tempDir, "skills", "skill-index.json"), "not valid json {{{");

			const result = await registry.listSkills();

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
		});
	});

	describe("loadSkill", () => {
		it("reads existing skill file and returns content string", async () => {
			const result = await registry.loadSkill("system/memory-recall.md");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe(skillFileContent);
		});

		it("returns SkillRegistryError when file does not exist", async () => {
			const result = await registry.loadSkill("system/nonexistent.md");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
		});

		it("returns SkillRegistryError for path traversal attempts", async () => {
			const result = await registry.loadSkill("../../../etc/passwd");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
			expect(result.error.message).toContain("path traversal");
		});

		it("returns SkillRegistryError for path with embedded .. segments", async () => {
			const result = await registry.loadSkill("system/../../../etc/passwd");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
		});

		it("returns SkillRegistryError for backslash path traversal", async () => {
			const result = await registry.loadSkill("..\\..\\etc\\passwd");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
		});
	});

	describe("registerSkill", () => {
		it("appends new skill to index", async () => {
			const newSkill = createTestSkill();

			const result = await registry.registerSkill(newSkill);

			expect(result.ok).toBe(true);

			const listResult = await registry.listSkills();
			expect(listResult.ok).toBe(true);
			if (!listResult.ok) return;
			expect(listResult.value).toHaveLength(3);
			expect(listResult.value[2]).toEqual(newSkill);
		});

		it("returns SkillRegistryError for duplicate skill name", async () => {
			const duplicate = createTestSkill({ name: "memory-recall" });

			const result = await registry.registerSkill(duplicate);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
			expect(result.error.message).toContain("already exists");
		});
	});

	describe("updateSkillStatus", () => {
		it("updates matching entry status", async () => {
			const result = await registry.updateSkillStatus("memory-recall", SkillStatus.Draft);

			expect(result.ok).toBe(true);

			const listResult = await registry.listSkills();
			expect(listResult.ok).toBe(true);
			if (!listResult.ok) return;
			const updated = listResult.value.find((s) => s.name === "memory-recall");
			expect(updated?.status).toBe(SkillStatus.Draft);
		});

		it("returns SkillRegistryError when skill not found", async () => {
			const result = await registry.updateSkillStatus("nonexistent", SkillStatus.Active);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error).toBeInstanceOf(SkillRegistryError);
			expect(result.error.message).toContain("not found");
		});
	});

	describe("seed file integration", () => {
		it("parses actual seed skill-index.json into valid Skill array", async () => {
			const seedIndexPath = path.resolve("seed/skills/skill-index.json");
			const seedContent = await Bun.file(seedIndexPath).text();

			const seedHome = await mkdtemp(path.join(tmpdir(), "nyx-seed-"));
			const seedSkillsDir = path.join(seedHome, "skills");
			await Bun.write(path.join(seedSkillsDir, "skill-index.json"), seedContent);

			const seedRegistry = new SkillRegistryImpl(seedHome);
			const result = await seedRegistry.listSkills();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(6);
			for (const skill of result.value) {
				expect(skill.name).toBeTruthy();
				expect(skill.description).toBeTruthy();
				expect(skill.type).toBe(SkillType.System);
				expect(skill.status).toBe(SkillStatus.Active);
				expect(skill.path).toMatch(/^system\//);
			}

			await rm(seedHome, { recursive: true, force: true });
		});
	});
});
