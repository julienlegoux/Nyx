import { describe, expect, test } from "bun:test";
import { createEmbedding } from "@nyx/domain/value-objects/embedding.value-object.ts";

describe("Embedding value object", () => {
	test("accepts exactly 768 dimensions", () => {
		const values = Array.from({ length: 768 }, () => Math.random());
		const result = createEmbedding(values);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.values).toHaveLength(768);
		}
	});

	test("rejects fewer than 768 dimensions", () => {
		const values = Array.from({ length: 100 }, () => Math.random());
		const result = createEmbedding(values);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("768");
		}
	});

	test("rejects more than 768 dimensions", () => {
		const values = Array.from({ length: 1000 }, () => Math.random());
		const result = createEmbedding(values);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects empty array", () => {
		const result = createEmbedding([]);
		expect(result.ok).toBe(false);
	});

	test("preserves values in created embedding", () => {
		const values = Array.from({ length: 768 }, (_, i) => i * 0.001);
		const result = createEmbedding(values);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.values[0]).toBe(0);
			expect(result.value.values[1]).toBe(0.001);
		}
	});

	test("defensively copies input array (caller mutation does not affect embedding)", () => {
		const values = Array.from({ length: 768 }, () => 1.0);
		const result = createEmbedding(values);
		expect(result.ok).toBe(true);
		if (result.ok) {
			values[0] = 999;
			expect(result.value.values[0]).toBe(1.0);
		}
	});

	test("rejects array containing NaN", () => {
		const values = Array.from({ length: 768 }, () => 0.5);
		values[100] = Number.NaN;
		const result = createEmbedding(values);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite");
		}
	});

	test("rejects array containing Infinity", () => {
		const values = Array.from({ length: 768 }, () => 0.5);
		values[0] = Number.POSITIVE_INFINITY;
		const result = createEmbedding(values);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects array containing -Infinity", () => {
		const values = Array.from({ length: 768 }, () => 0.5);
		values[767] = Number.NEGATIVE_INFINITY;
		const result = createEmbedding(values);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});
});
