import type { Result } from "../types/result.type.ts";

export interface EmbeddingProvider {
	embed(content: string): Promise<Result<number[]>>;
}
