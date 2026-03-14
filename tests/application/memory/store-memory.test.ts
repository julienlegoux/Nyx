import { describe, expect, it, mock } from "bun:test";
import { StoreMemoryUseCase } from "@nyx/application/memory/store-memory.usecase.ts";
import { EmbeddingError, MemoryStoreError } from "@nyx/domain/errors/domain.error.ts";
import type { EmbeddingProvider } from "@nyx/domain/ports/embedding-provider.interface.ts";
import type { MemoryStore } from "@nyx/domain/ports/memory-store.interface.ts";
import { SourceType } from "@nyx/domain/types/memory.type.ts";
import type { Memory } from "@nyx/domain/types/memory.type.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";

function mockEmbeddingProvider(
	result: Result<number[]> = { ok: true, value: new Array(768).fill(0.1) },
): EmbeddingProvider {
	return {
		embed: mock(() => Promise.resolve(result)),
	};
}

function mockMemoryStore(storeResult: Result<void> = { ok: true, value: undefined }) {
	let capturedMemory: Memory | null = null;
	const store: MemoryStore = {
		store: mock((memory: Memory) => {
			capturedMemory = memory;
			return Promise.resolve(storeResult);
		}),
		queryBySimilarity: mock(() => Promise.resolve({ ok: true as const, value: [] as Memory[] })),
		queryRecent: mock(() => Promise.resolve({ ok: true as const, value: [] as Memory[] })),
		queryRandom: mock(() => Promise.resolve({ ok: true as const, value: null })),
		queryById: mock(() => Promise.resolve({ ok: true as const, value: null })),
		queryLinked: mock(() => Promise.resolve({ ok: true as const, value: [] as Memory[] })),
		updateSignificance: mock(() => Promise.resolve({ ok: true as const, value: undefined })),
		updateTags: mock(() => Promise.resolve({ ok: true as const, value: undefined })),
		linkMemories: mock(() => Promise.resolve({ ok: true as const, value: undefined })),
		compositeQuery: mock(() => Promise.resolve({ ok: true as const, value: [] as Memory[] })),
	};
	return { store, getCapturedMemory: () => capturedMemory as Memory };
}

describe("StoreMemoryUseCase", () => {
	it("calls embeddingProvider.embed() with content", async () => {
		const embedProvider = mockEmbeddingProvider();
		const { store: memStore } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		await useCase.execute("Hello world", SourceType.Conversation);

		expect(embedProvider.embed).toHaveBeenCalledTimes(1);
		expect(embedProvider.embed).toHaveBeenCalledWith("Hello world");
	});

	it("creates Memory entity with embedding result and passes to memoryStore.store()", async () => {
		const embedding = new Array(768).fill(0.5);
		const embedProvider = mockEmbeddingProvider({ ok: true, value: embedding });
		const { store: memStore, getCapturedMemory } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		const result = await useCase.execute("My memory", SourceType.Reflection);

		expect(result.ok).toBe(true);
		expect(memStore.store).toHaveBeenCalledTimes(1);

		const storedMemory = getCapturedMemory();
		expect(storedMemory.content).toBe("My memory");
		expect(storedMemory.sourceType).toBe(SourceType.Reflection);
		expect(storedMemory.embedding).toEqual(embedding);
		expect(storedMemory.accessCount).toBe(0);
		expect(storedMemory.lastAccessed).toBeNull();
		expect(storedMemory.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});

	it("returns embedding error if embed() fails (does NOT call store)", async () => {
		const embedProvider = mockEmbeddingProvider({
			ok: false,
			error: new EmbeddingError("Model failed"),
		});
		const { store: memStore } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		const result = await useCase.execute("test", SourceType.Conversation);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(EmbeddingError);
			expect(result.error.message).toContain("Model failed");
		}
		expect(memStore.store).not.toHaveBeenCalled();
	});

	it("returns store error if store() fails", async () => {
		const embedProvider = mockEmbeddingProvider();
		const { store: memStore } = mockMemoryStore({
			ok: false,
			error: new MemoryStoreError("DB write failed"),
		});
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		const result = await useCase.execute("test", SourceType.Action);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeInstanceOf(MemoryStoreError);
			expect(result.error.message).toContain("DB write failed");
		}
	});

	it("uses default significance (0.5) when not provided", async () => {
		const embedProvider = mockEmbeddingProvider();
		const { store: memStore, getCapturedMemory } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		await useCase.execute("test", SourceType.Observation);

		expect(getCapturedMemory().significance).toBe(0.5);
	});

	it("uses default empty arrays for tags and linkedIds when not provided", async () => {
		const embedProvider = mockEmbeddingProvider();
		const { store: memStore, getCapturedMemory } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		await useCase.execute("test", SourceType.Conversation);

		expect(getCapturedMemory().tags).toEqual([]);
		expect(getCapturedMemory().linkedIds).toEqual([]);
	});

	it("passes tags, linkedIds, significance when provided", async () => {
		const embedProvider = mockEmbeddingProvider();
		const { store: memStore, getCapturedMemory } = mockMemoryStore();
		const useCase = new StoreMemoryUseCase(embedProvider, memStore);

		const linkedId = "b1ffcc00-1d1b-5ef9-cc7e-7cc0ce491b22";
		await useCase.execute("test", SourceType.Conversation, {
			tags: ["important", "conversation"],
			linkedIds: [linkedId],
			significance: 0.9,
		});

		const stored = getCapturedMemory();
		expect(stored.tags).toEqual(["important", "conversation"]);
		expect(stored.linkedIds).toEqual([linkedId]);
		expect(stored.significance).toBe(0.9);
	});
});
