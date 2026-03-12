import type { Memory, RetrievalWeights } from "../types/memory.type.ts";
import type { Result } from "../types/result.type.ts";

export interface MemoryStore {
	store(memory: Memory): Promise<Result<void>>;
	queryBySimilarity(embedding: number[], limit: number): Promise<Result<Memory[]>>;
	queryRecent(limit: number): Promise<Result<Memory[]>>;
	queryRandom(): Promise<Result<Memory | null>>;
	queryById(id: string): Promise<Result<Memory | null>>;
	queryLinked(memoryId: string): Promise<Result<Memory[]>>;
	updateSignificance(id: string, significance: number): Promise<Result<void>>;
	updateTags(id: string, tags: string[]): Promise<Result<void>>;
	compositeQuery(
		embedding: number[],
		weights: RetrievalWeights,
		limit: number,
	): Promise<Result<Memory[]>>;
}
