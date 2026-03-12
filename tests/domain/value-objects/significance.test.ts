import { describe, expect, test } from "bun:test";
import { createSignificance } from "@nyx/domain/value-objects/significance.value-object.ts";

describe("Significance value object", () => {
	test("accepts 0.0 (inclusive lower bound)", () => {
		const result = createSignificance(0);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.value).toBe(0);
		}
	});

	test("accepts 1.0 (inclusive upper bound)", () => {
		const result = createSignificance(1);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.value).toBe(1);
		}
	});

	test("accepts 0.5 (middle value)", () => {
		const result = createSignificance(0.5);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.value).toBe(0.5);
		}
	});

	test("rejects negative value", () => {
		const result = createSignificance(-0.1);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects value greater than 1", () => {
		const result = createSignificance(1.1);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects NaN", () => {
		const result = createSignificance(Number.NaN);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects Infinity", () => {
		const result = createSignificance(Number.POSITIVE_INFINITY);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects -Infinity", () => {
		const result = createSignificance(Number.NEGATIVE_INFINITY);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});
});
