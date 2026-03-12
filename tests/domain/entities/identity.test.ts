import { describe, expect, test } from "bun:test";
import { createIdentityEntity } from "@nyx/domain/entities/identity.entity.ts";

describe("IdentityEntity factory", () => {
	test("creates entity from valid params", () => {
		const result = createIdentityEntity({
			rawContent: "# Nyx Identity\nI am Nyx.",
			retrievalWeights: { similarity: 0.5, significance: 0.3, recency: 0.2 },
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.rawContent).toBe("# Nyx Identity\nI am Nyx.");
			expect(result.value.retrievalWeights.similarity).toBe(0.5);
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
});
