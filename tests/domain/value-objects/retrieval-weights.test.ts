import { describe, expect, test } from "bun:test";
import { createRetrievalWeights } from "@nyx/domain/value-objects/retrieval-weights.value-object.ts";

describe("RetrievalWeights value object", () => {
	test("accepts weights that sum to 1.0", () => {
		const result = createRetrievalWeights(0.5, 0.3, 0.2);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.similarity).toBe(0.5);
			expect(result.value.significance).toBe(0.3);
			expect(result.value.recency).toBe(0.2);
		}
	});

	test("accepts equal weights (1/3 each)", () => {
		const third = 1 / 3;
		const result = createRetrievalWeights(third, third, third);
		expect(result.ok).toBe(true);
	});

	test("accepts edge case: one weight is 1.0, others are 0", () => {
		const result = createRetrievalWeights(1.0, 0, 0);
		expect(result.ok).toBe(true);
	});

	test("rejects weights that sum to less than 1.0", () => {
		const result = createRetrievalWeights(0.3, 0.3, 0.3);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("sum to 1.0");
		}
	});

	test("rejects weights that sum to more than 1.0", () => {
		const result = createRetrievalWeights(0.5, 0.5, 0.5);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects negative weights", () => {
		const result = createRetrievalWeights(-0.5, 1.0, 0.5);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite non-negative");
		}
	});

	test("rejects NaN similarity", () => {
		const result = createRetrievalWeights(Number.NaN, 0.5, 0.5);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects NaN significance", () => {
		const result = createRetrievalWeights(0.5, Number.NaN, 0.5);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects NaN recency", () => {
		const result = createRetrievalWeights(0.5, 0.5, Number.NaN);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects Infinity weight", () => {
		const result = createRetrievalWeights(Number.POSITIVE_INFINITY, 0, 0);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});
});
