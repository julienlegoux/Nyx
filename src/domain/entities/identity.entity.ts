import { ValidationError } from "../errors/domain.error.ts";
import type { RetrievalWeights } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";
import { createRetrievalWeights } from "../value-objects/retrieval-weights.value-object.ts";

export interface IdentityEntity {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}

export function createIdentityEntity(params: {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}): Result<IdentityEntity> {
	if (!params.rawContent.trim()) {
		return {
			ok: false,
			error: new ValidationError("Identity rawContent must be non-empty"),
		};
	}

	const weightsResult = createRetrievalWeights(
		params.retrievalWeights.similarity,
		params.retrievalWeights.significance,
		params.retrievalWeights.recency,
	);
	if (!weightsResult.ok) {
		return { ok: false, error: weightsResult.error };
	}

	return {
		ok: true,
		value: {
			rawContent: params.rawContent,
			retrievalWeights: weightsResult.value,
		},
	};
}
