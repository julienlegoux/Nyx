import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";

export interface Significance {
	readonly value: number;
}

export function createSignificance(value: number): Result<Significance> {
	if (Number.isNaN(value) || value < 0 || value > 1) {
		return {
			ok: false,
			error: new ValidationError(`Significance must be between 0.0 and 1.0, got ${value}`),
		};
	}

	return { ok: true, value: { value } };
}
