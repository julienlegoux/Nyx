import { ValidationError } from "../errors/domain.error.ts";
import type { Memory, SourceType } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";

export type MemoryEntity = Memory;

const embeddingDimensions = 768;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createMemoryEntity(params: {
	id: string;
	content: string;
	embedding: number[];
	createdAt: Date;
	sourceType: SourceType;
	accessCount: number;
	lastAccessed: Date | null;
	significance: number;
	tags: string[];
	linkedIds: string[];
}): Result<MemoryEntity> {
	if (!uuidPattern.test(params.id)) {
		return {
			ok: false,
			error: new ValidationError(`id must be a valid UUID, got "${params.id}"`),
		};
	}

	if (params.embedding.length !== embeddingDimensions) {
		return {
			ok: false,
			error: new ValidationError(
				`Embedding must have exactly ${embeddingDimensions} dimensions, got ${params.embedding.length}`,
			),
		};
	}

	if (Number.isNaN(params.significance) || params.significance < 0 || params.significance > 1) {
		return {
			ok: false,
			error: new ValidationError(
				`Significance must be between 0 and 1, got ${params.significance}`,
			),
		};
	}

	return { ok: true, value: params };
}
