import type { RetrievalWeights } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";

export interface IdentityEntity {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}

export function createIdentityEntity(params: {
	rawContent: string;
	retrievalWeights: RetrievalWeights;
}): Result<IdentityEntity> {
	return { ok: true, value: params };
}
