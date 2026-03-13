import { uuidPattern } from "../constants.ts";
import { ValidationError } from "../errors/domain.error.ts";
import type { Memory, SourceType } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";
import { createEmbedding } from "../value-objects/embedding.value-object.ts";
import { createSignificance } from "../value-objects/significance.value-object.ts";

export interface MemoryEntity extends Memory {}

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

	if (!params.content.trim()) {
		return {
			ok: false,
			error: new ValidationError("Memory content must be non-empty"),
		};
	}

	const embeddingResult = createEmbedding(params.embedding);
	if (!embeddingResult.ok) return embeddingResult;

	const significanceResult = createSignificance(params.significance);
	if (!significanceResult.ok) return significanceResult;

	if (!Number.isInteger(params.accessCount) || params.accessCount < 0) {
		return {
			ok: false,
			error: new ValidationError(
				`accessCount must be a non-negative integer, got ${params.accessCount}`,
			),
		};
	}

	for (const tag of params.tags) {
		if (!tag.trim()) {
			return {
				ok: false,
				error: new ValidationError("tags must not contain empty or whitespace-only strings"),
			};
		}
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
