import { MemoryStoreError } from "@nyx/domain/errors/domain.error.ts";
import type { Logger } from "@nyx/domain/ports/logger.interface.ts";
import type { MemoryStore } from "@nyx/domain/ports/memory-store.interface.ts";
import type { Memory, RetrievalWeights } from "@nyx/domain/types/memory.type.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";
import { eq } from "drizzle-orm";
import type { DrizzleClient } from "./database.config.ts";
import { memories } from "./schema/index.ts";

function toRow(memory: Memory) {
	return {
		id: memory.id,
		content: memory.content,
		embedding: memory.embedding,
		createdAt: memory.createdAt,
		sourceType: memory.sourceType as string,
		accessCount: memory.accessCount,
		lastAccessed: memory.lastAccessed,
		significance: memory.significance,
		tags: memory.tags,
		linkedIds: memory.linkedIds,
	};
}

export class MemoryStoreImpl implements MemoryStore {
	constructor(
		private readonly db: DrizzleClient,
		private readonly logger: Logger,
	) {}

	async store(memory: Memory): Promise<Result<void>> {
		try {
			await this.db.insert(memories).values(toRow(memory));
			return { ok: true, value: undefined };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error("Failed to store memory", { memoryId: memory.id, error: message });
			return {
				ok: false,
				error: new MemoryStoreError(`Failed to store memory: ${message}`),
			};
		}
	}

	async updateSignificance(id: string, significance: number): Promise<Result<void>> {
		if (significance < 0 || significance > 1 || Number.isNaN(significance)) {
			return {
				ok: false,
				error: new MemoryStoreError(
					`Significance must be between 0.0 and 1.0, got ${significance}`,
				),
			};
		}
		try {
			const rows = await this.db
				.update(memories)
				.set({ significance })
				.where(eq(memories.id, id))
				.returning({ id: memories.id });
			if (rows.length === 0) {
				return { ok: false, error: new MemoryStoreError(`Memory not found: ${id}`) };
			}
			return { ok: true, value: undefined };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error("Failed to update significance", { memoryId: id, error: message });
			return {
				ok: false,
				error: new MemoryStoreError(`Failed to update significance: ${message}`),
			};
		}
	}

	async updateTags(id: string, tags: string[]): Promise<Result<void>> {
		try {
			const rows = await this.db
				.update(memories)
				.set({ tags })
				.where(eq(memories.id, id))
				.returning({ id: memories.id });
			if (rows.length === 0) {
				return { ok: false, error: new MemoryStoreError(`Memory not found: ${id}`) };
			}
			return { ok: true, value: undefined };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error("Failed to update tags", { memoryId: id, error: message });
			return {
				ok: false,
				error: new MemoryStoreError(`Failed to update tags: ${message}`),
			};
		}
	}

	async linkMemories(id: string, linkedIds: string[]): Promise<Result<void>> {
		try {
			const rows = await this.db
				.update(memories)
				.set({ linkedIds })
				.where(eq(memories.id, id))
				.returning({ id: memories.id });
			if (rows.length === 0) {
				return { ok: false, error: new MemoryStoreError(`Memory not found: ${id}`) };
			}
			return { ok: true, value: undefined };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.logger.error("Failed to link memories", { memoryId: id, error: message });
			return {
				ok: false,
				error: new MemoryStoreError(`Failed to link memories: ${message}`),
			};
		}
	}

	async queryBySimilarity(_embedding: number[], _limit: number): Promise<Result<Memory[]>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.4"),
		};
	}

	async queryRecent(_limit: number): Promise<Result<Memory[]>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.4"),
		};
	}

	async queryRandom(): Promise<Result<Memory | null>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.4"),
		};
	}

	async queryById(_id: string): Promise<Result<Memory | null>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.4"),
		};
	}

	async queryLinked(_memoryId: string): Promise<Result<Memory[]>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.4"),
		};
	}

	async compositeQuery(
		_embedding: number[],
		_weights: RetrievalWeights,
		_limit: number,
	): Promise<Result<Memory[]>> {
		return {
			ok: false,
			error: new MemoryStoreError("Not implemented — see Story 2.5"),
		};
	}
}
