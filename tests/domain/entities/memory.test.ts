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
		linkedIds: [] as string[],
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

	test("rejects negative accessCount", () => {
		const params = validMemoryParams();
		params.accessCount = -1;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("accessCount");
		}
	});

	test("rejects non-integer accessCount", () => {
		const params = validMemoryParams();
		params.accessCount = 2.5;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("accessCount");
		}
	});

	test("accepts zero accessCount", () => {
		const params = validMemoryParams();
		params.accessCount = 0;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
	});

	test("rejects invalid UUID in linkedIds", () => {
		const params = validMemoryParams();
		params.linkedIds = ["not-a-uuid"];
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("linkedIds");
		}
	});

	test("accepts valid UUIDs in linkedIds", () => {
		const params = validMemoryParams();
		params.linkedIds = [
			"550e8400-e29b-41d4-a716-446655440001",
			"550e8400-e29b-41d4-a716-446655440002",
		];
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.linkedIds).toHaveLength(2);
		}
	});

	test("accepts empty linkedIds", () => {
		const params = validMemoryParams();
		params.linkedIds = [];
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
	});

	test("rejects embedding containing NaN", () => {
		const params = validMemoryParams();
		params.embedding[100] = Number.NaN;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite");
		}
	});

	test("rejects embedding containing Infinity", () => {
		const params = validMemoryParams();
		params.embedding[0] = Number.POSITIVE_INFINITY;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite");
		}
	});

	test("rejects embedding containing -Infinity", () => {
		const params = validMemoryParams();
		params.embedding[767] = Number.NEGATIVE_INFINITY;
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("defensively copies embedding array", () => {
		const params = validMemoryParams();
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			params.embedding[0] = 999;
			expect(result.value.embedding[0]).not.toBe(999);
		}
	});

	test("defensively copies tags array", () => {
		const params = validMemoryParams();
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			params.tags.push("mutated");
			expect(result.value.tags).toEqual(["test"]);
		}
	});

	test("defensively copies linkedIds array", () => {
		const params = validMemoryParams();
		params.linkedIds = ["550e8400-e29b-41d4-a716-446655440001"];
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			params.linkedIds.push("550e8400-e29b-41d4-a716-446655440002");
			expect(result.value.linkedIds).toHaveLength(1);
		}
	});

	test("defensively copies createdAt Date", () => {
		const params = validMemoryParams();
		const originalTime = params.createdAt.getTime();
		const result = createMemoryEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			params.createdAt.setTime(0);
			expect(result.value.createdAt.getTime()).toBe(originalTime);
			expect(result.value.createdAt).not.toBe(params.createdAt);
		}
	});

	test("defensively copies lastAccessed Date when non-null", () => {
		const lastAccessed = new Date();
		const originalTime = lastAccessed.getTime();
		const result = createMemoryEntity({
			...validMemoryParams(),
			lastAccessed,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			lastAccessed.setTime(0);
			expect(result.value.lastAccessed).not.toBeNull();
			expect(result.value.lastAccessed?.getTime()).toBe(originalTime);
			expect(result.value.lastAccessed).not.toBe(lastAccessed);
		}
	});
});
