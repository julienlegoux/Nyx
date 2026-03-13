import { ValidationError } from "../errors/domain.error.ts";
import type { RetrievalWeights } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";

export interface IdentityEntity {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}

const weightsTolerance = 1e-9;

export function createIdentityEntity(params: {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}): Result<IdentityEntity> {
	if (!params.rawContent) {
		return {
			ok: false,
			error: new ValidationError("Identity rawContent must be non-empty"),
		};
	}

	const { similarity, significance, recency } = params.retrievalWeights;
	if (
		!Number.isFinite(similarity) ||
		!Number.isFinite(significance) ||
		!Number.isFinite(recency) ||
		similarity < 0 ||
		significance < 0 ||
		recency < 0
	) {
		return {
			ok: false,
			error: new ValidationError("All retrieval weights must be finite non-negative numbers"),
		};
	}

	const sum = similarity + significance + recency;
	if (Math.abs(sum - 1.0) > weightsTolerance) {
		return {
			ok: false,
			error: new ValidationError(`Retrieval weights must sum to 1.0, got ${sum}`),
		};
	}

	return {
		ok: true,
		value: {
			rawContent: params.rawContent,
			retrievalWeights: { ...params.retrievalWeights },
		},
	};
}
