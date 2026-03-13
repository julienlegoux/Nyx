import { describe, expect, it } from "bun:test";
import { memories } from "@nyx/infrastructure/database/schema/index.ts";
import { getTableName } from "drizzle-orm";

describe("memory.schema", () => {
	it("exports memories table with correct database name", () => {
		expect(getTableName(memories)).toBe("memories");
	});

	it("has all expected columns", () => {
		const columnNames = Object.keys(memories);
		const expected = [
			"id",
			"content",
			"embedding",
			"createdAt",
			"sourceType",
			"accessCount",
			"lastAccessed",
			"significance",
			"tags",
			"linkedIds",
		];

		for (const name of expected) {
			expect(columnNames).toContain(name);
		}
	});

	it("id column is not null with default", () => {
		expect(memories.id.notNull).toBe(true);
		expect(memories.id.hasDefault).toBe(true);
	});

	it("content column is not null", () => {
		expect(memories.content.notNull).toBe(true);
	});

	it("embedding column is not null", () => {
		expect(memories.embedding.notNull).toBe(true);
	});

	it("createdAt column is not null with default", () => {
		expect(memories.createdAt.notNull).toBe(true);
		expect(memories.createdAt.hasDefault).toBe(true);
	});

	it("sourceType column is not null", () => {
		expect(memories.sourceType.notNull).toBe(true);
	});

	it("accessCount column is not null with default", () => {
		expect(memories.accessCount.notNull).toBe(true);
		expect(memories.accessCount.hasDefault).toBe(true);
	});

	it("lastAccessed column is nullable", () => {
		expect(memories.lastAccessed.notNull).toBe(false);
	});

	it("significance column is not null with default", () => {
		expect(memories.significance.notNull).toBe(true);
		expect(memories.significance.hasDefault).toBe(true);
	});

	it("tags column is not null", () => {
		expect(memories.tags.notNull).toBe(true);
	});

	it("linkedIds column is not null", () => {
		expect(memories.linkedIds.notNull).toBe(true);
	});
});
