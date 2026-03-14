import { createMemoryEntity } from "@nyx/domain/entities/memory.entity.ts";
import type { EmbeddingProvider } from "@nyx/domain/ports/embedding-provider.interface.ts";
import type { MemoryStore } from "@nyx/domain/ports/memory-store.interface.ts";
import type { SourceType } from "@nyx/domain/types/memory.type.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";

export class StoreMemoryUseCase {
	constructor(
		private readonly embeddingProvider: EmbeddingProvider,
		private readonly memoryStore: MemoryStore,
	) {}

	async execute(
		content: string,
		sourceType: SourceType,
		options?: {
			tags?: string[];
			linkedIds?: string[];
			significance?: number;
		},
	): Promise<Result<void>> {
		const embedResult = await this.embeddingProvider.embed(content);
		if (!embedResult.ok) return embedResult;

		const memoryResult = createMemoryEntity({
			id: crypto.randomUUID(),
			content,
			embedding: embedResult.value,
			createdAt: new Date(),
			sourceType,
			accessCount: 0,
			lastAccessed: null,
			significance: options?.significance ?? 0.5,
			tags: options?.tags ?? [],
			linkedIds: options?.linkedIds ?? [],
		});
		if (!memoryResult.ok) return memoryResult;

		return this.memoryStore.store(memoryResult.value);
	}
}
