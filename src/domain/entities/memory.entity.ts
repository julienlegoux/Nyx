import { ValidationError } from "../errors/domain.error.ts";
import type { Memory, SourceType } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";
import { embeddingDimensions } from "../value-objects/embedding.value-object.ts";

export type MemoryEntity = Memory;
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

	for (const v of params.embedding) {
		if (!Number.isFinite(v)) {
			return {
				ok: false,
				error: new ValidationError("Embedding values must be finite numbers (no NaN or Infinity)"),
			};
		}
	}

	if (Number.isNaN(params.significance) || params.significance < 0 || params.significance > 1) {
		return {
			ok: false,
			error: new ValidationError(
				`Significance must be between 0 and 1, got ${params.significance}`,
			),
		};
	}

	if (!Number.isInteger(params.accessCount) || params.accessCount < 0) {
		return {
			ok: false,
			error: new ValidationError(
				`accessCount must be a non-negative integer, got ${params.accessCount}`,
			),
		};
	}

	for (const linkedId of params.linkedIds) {
		if (!uuidPattern.test(linkedId)) {
			return {
				ok: false,
				error: new ValidationError(`linkedIds must contain valid UUIDs, got "${linkedId}"`),
			};
		}
	}

	return {
		ok: true,
		value: {
			...params,
			createdAt: new Date(params.createdAt.getTime()),
			lastAccessed: params.lastAccessed ? new Date(params.lastAccessed.getTime()) : null,
			embedding: [...params.embedding],
			tags: [...params.tags],
			linkedIds: [...params.linkedIds],
		},
	};
}
