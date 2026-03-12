import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";

export interface Embedding {
	readonly values: readonly number[];
}

export const embeddingDimensions = 768;

export function createEmbedding(values: number[]): Result<Embedding> {
	if (values.length !== embeddingDimensions) {
		return {
			ok: false,
			error: new ValidationError(
				`Embedding must have exactly ${embeddingDimensions} dimensions, got ${values.length}`,
			),
		};
	}

	for (const v of values) {
		if (!Number.isFinite(v)) {
			return {
				ok: false,
				error: new ValidationError("Embedding values must be finite numbers (no NaN or Infinity)"),
			};
		}
	}

	return { ok: true, value: { values: [...values] } };
}
