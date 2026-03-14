import { type FeatureExtractionPipeline, pipeline } from "@huggingface/transformers";
import { EmbeddingError } from "@nyx/domain/errors/domain.error.ts";
import type { EmbeddingProvider } from "@nyx/domain/ports/index.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";

const EMBEDDING_DIMENSIONS = 768;
const TASK_PREFIX = "search_document: ";

export class EmbeddingProviderImpl implements EmbeddingProvider {
	constructor(private readonly extractor: FeatureExtractionPipeline) {}

	async embed(content: string): Promise<Result<number[]>> {
		if (content.trim() === "") {
			return {
				ok: false,
				error: new EmbeddingError("Cannot embed empty content"),
			};
		}

		try {
			const output = await this.extractor(`${TASK_PREFIX}${content}`, {
				pooling: "mean",
				normalize: true,
			});

			const vector: number[] = Array.from(output.data as Float32Array);

			if (vector.length !== EMBEDDING_DIMENSIONS) {
				return {
					ok: false,
					error: new EmbeddingError(
						`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector.length}`,
					),
				};
			}

			return { ok: true, value: vector };
		} catch (err) {
			return {
				ok: false,
				error: new EmbeddingError(
					`Embedding failed: ${err instanceof Error ? err.message : String(err)}`,
				),
			};
		}
	}
}

export async function createEmbeddingProvider(): Promise<EmbeddingProvider> {
	const extractor = await pipeline("feature-extraction", "nomic-ai/nomic-embed-text-v1.5", {
		dtype: "fp32",
	});
	return new EmbeddingProviderImpl(extractor as unknown as FeatureExtractionPipeline);
}
