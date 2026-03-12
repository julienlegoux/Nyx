import { ValidationError } from "../errors/domain.error.ts";
import type { RetrievalWeights } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";

export type { RetrievalWeights };

const tolerance = 1e-9;

export function createRetrievalWeights(
	similarity: number,
	significance: number,
	recency: number,
): Result<RetrievalWeights> {
	if (
		Number.isNaN(similarity) ||
		Number.isNaN(significance) ||
		Number.isNaN(recency) ||
		similarity < 0 ||
		significance < 0 ||
		recency < 0
	) {
		return {
			ok: false,
			error: new ValidationError("All retrieval weights must be non-negative numbers"),
		};
	}

	const sum = similarity + significance + recency;
	if (Math.abs(sum - 1.0) > tolerance) {
		return {
			ok: false,
			error: new ValidationError(`Retrieval weights must sum to 1.0, got ${sum}`),
		};
	}

	return { ok: true, value: { similarity, significance, recency } };
}
