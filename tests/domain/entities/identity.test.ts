import { describe, expect, test } from "bun:test";
import { createIdentityEntity } from "@nyx/domain/entities/identity.entity.ts";

describe("IdentityEntity factory", () => {
	const validWeights = { similarity: 0.5, significance: 0.3, recency: 0.2 };

	test("creates entity from valid params", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx Identity\nI am Nyx.",
			retrievalWeights: { ...validWeights },
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.rawContent).toBe("# Nyx Identity\nI am Nyx.");
			expect(result.value.retrievalWeights.similarity).toBe(0.5);
		}
	});

	test("rejects empty rawContent", () => {
		const result = createIdentityEntity({
			rawContent: "",
			retrievalWeights: { ...validWeights },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("rawContent");
		}
	});

	test("rejects retrieval weights that don't sum to 1.0", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx",
			retrievalWeights: { similarity: 0.5, significance: 0.5, recency: 0.5 },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("sum to 1.0");
		}
	});

	test("rejects negative retrieval weights", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx",
			retrievalWeights: { similarity: -0.5, significance: 1.0, recency: 0.5 },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite non-negative");
		}
	});

	test("rejects NaN retrieval weight", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx",
			retrievalWeights: { similarity: Number.NaN, significance: 0.5, recency: 0.5 },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
		}
	});

	test("rejects Infinity retrieval weight", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx",
			retrievalWeights: {
				similarity: Number.POSITIVE_INFINITY,
				significance: 0.5,
				recency: 0.5,
			},
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("finite non-negative");
		}
	});

	test("defensively copies retrievalWeights object", () => {
		const weights = { ...validWeights };
		const result = createIdentityEntity({
			rawContent: "# Nyx",
			retrievalWeights: weights,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			weights.similarity = 0.99;
			expect(result.value.retrievalWeights.similarity).toBe(0.5);
		}
	});

	test("returns a new object, not the input reference", () => {
		const params = {
			rawContent: "# Nyx",
			retrievalWeights: { ...validWeights },
		};
		const result = createIdentityEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBe(params);
		}
	});
});
