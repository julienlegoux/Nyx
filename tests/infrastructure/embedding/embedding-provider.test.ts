import { describe, expect, it, mock } from "bun:test";
import { EmbeddingError } from "@nyx/domain/errors/domain.error.ts";
import {
	EmbeddingProviderImpl,
	createEmbeddingProvider,
} from "@nyx/infrastructure/embedding/embedding-provider.implementation.ts";

function mockExtractor(data: Float32Array = new Float32Array(768).fill(0.1)) {
	return mock((_text: string, _options: Record<string, unknown>) => Promise.resolve({ data }));
}

describe("EmbeddingProviderImpl", () => {
	it("implements embed() method", () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		expect(typeof provider.embed).toBe("function");
	});

	it("returns EmbeddingError for empty string", async () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(EmbeddingError);
			expect(result.error.message).toContain("empty content");
		}
	});

	it("returns EmbeddingError for whitespace-only string", async () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("   ");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(EmbeddingError);
		}
	});

	it("returns 768-dimension vector on valid input", async () => {
		const data = new Float32Array(768);
		for (let i = 0; i < 768; i++) {
			data[i] = Math.random();
		}
		const extractor = mockExtractor(data);
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("test content");

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toHaveLength(768);
			expect(Array.isArray(result.value)).toBe(true);
			expect(typeof result.value[0]).toBe("number");
		}
	});

	it("prepends 'search_document: ' prefix to content", async () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		await provider.embed("hello world");

		expect(extractor).toHaveBeenCalledTimes(1);
		const calledWith = extractor.mock.calls[0]?.[0];
		expect(calledWith).toBe("search_document: hello world");
	});

	it("wraps pipeline errors in EmbeddingError", async () => {
		const extractor = mock(() => Promise.reject(new Error("ONNX runtime failure")));
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("test content");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(EmbeddingError);
			expect(result.error.message).toContain("ONNX runtime failure");
		}
	});

	it("returns EmbeddingError if output vector is not 768 dimensions", async () => {
		const wrongDimData = new Float32Array(512).fill(0.1);
		const extractor = mockExtractor(wrongDimData);
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("test content");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(EmbeddingError);
			expect(result.error.message).toContain("768");
			expect(result.error.message).toContain("512");
		}
	});

	it("returns number[] not Float32Array", async () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		const result = await provider.embed("test");

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBeInstanceOf(Float32Array);
			expect(Array.isArray(result.value)).toBe(true);
		}
	});

	it("passes pooling and normalize options to extractor", async () => {
		const extractor = mockExtractor();
		const provider = new EmbeddingProviderImpl(extractor as never);

		await provider.embed("test");

		const options = extractor.mock.calls[0]?.[1] as Record<string, unknown>;
		expect(options.pooling).toBe("mean");
		expect(options.normalize).toBe(true);
	});
});

describe("createEmbeddingProvider", () => {
	it("is an async function", () => {
		expect(typeof createEmbeddingProvider).toBe("function");
	});
});
