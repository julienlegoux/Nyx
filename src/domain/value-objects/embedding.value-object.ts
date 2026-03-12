import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";

export interface Embedding {
	readonly values: readonly number[];
}

const embeddingDimensions = 768;

export function createEmbedding(values: number[]): Result<Embedding> {
	if (values.length !== embeddingDimensions) {
		return {
			ok: false,
			error: new ValidationError(
				`Embedding must have exactly ${embeddingDimensions} dimensions, got ${values.length}`,
			),
		};
	}

	return { ok: true, value: { values: [...values] } };
}
