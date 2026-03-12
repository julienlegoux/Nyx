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
});
