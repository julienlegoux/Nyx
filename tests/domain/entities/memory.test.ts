import { describe, expect, test } from "bun:test";
import { createMemoryEntity } from "@nyx/domain/entities/memory.entity.ts";
import { SourceType } from "@nyx/domain/types/memory.type.ts";

function validMemoryParams() {
	return {
		id: "550e8400-e29b-41d4-a716-446655440000",
		content: "A test memory",
		embedding: Array.from({ length: 768 }, () => Math.random()),
		createdAt: new Date(),
		sourceType: SourceType.Conversation,
		accessCount: 0,
		lastAccessed: null,
		significance: 0.5,
		tags: ["test"],
		linkedIds: [],
	};
}

describe("Memory entity", () => {
	test("creates entity with valid params", () => {
		const result = createMemoryEntity(validMemoryParams());
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.id).toBe("550e8400-e29b-41d4-a716-446655440000");
			expect(result.value.content).toBe("A test memory");
			expect(result.value.sourceType).toBe(SourceType.Conversation);
			expect(result.value.accessCount).toBe(0);
			expect(result.value.lastAccessed).toBeNull();
			expect(result.value.significance).toBe(0.5);
			expect(result.value.tags).toEqual(["test"]);
			expect(result.value.linkedIds).toEqual([]);
		}
	});

	test("rejects invalid embedding dimensions", () => {
		const params = validMemoryParams();
		params.embedding = [1, 2, 3];
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("768");
		}
	});

	test("rejects significance below 0", () => {
		const params = validMemoryParams();
		params.significance = -0.1;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects significance above 1", () => {
		const params = validMemoryParams();
		params.significance = 1.5;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("accepts significance at boundaries (0 and 1)", () => {
		const params0 = validMemoryParams();
		params0.significance = 0;
		expect(createMemoryEntity(params0).ok).toBe(true);

		const params1 = validMemoryParams();
		params1.significance = 1;
		expect(createMemoryEntity(params1).ok).toBe(true);
	});

	test("accepts all source types", () => {
		for (const sourceType of Object.values(SourceType)) {
			const params = validMemoryParams();
			params.sourceType = sourceType;
			const result = createMemoryEntity(params);
			expect(result.ok).toBe(true);
		}
	});

	test("rejects NaN significance", () => {
		const params = validMemoryParams();
		params.significance = Number.NaN;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects invalid UUID format", () => {
		const params = validMemoryParams();
		params.id = "not-a-uuid";
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("UUID");
		}
	});

	test("accepts valid UUID formats", () => {
		const params = validMemoryParams();
		params.id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
	});
});
