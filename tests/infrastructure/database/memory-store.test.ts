import { describe, expect, it, mock } from "bun:test";
import { MemoryStoreError } from "@nyx/domain/errors/domain.error.ts";
import type { Logger } from "@nyx/domain/ports/logger.interface.ts";
import { SourceType } from "@nyx/domain/types/memory.type.ts";
import type { Memory } from "@nyx/domain/types/memory.type.ts";
import type { DrizzleClient } from "@nyx/infrastructure/database/database.config.ts";
import { MemoryStoreImpl } from "@nyx/infrastructure/database/memory-store.implementation.ts";

function mockLogger(): Logger {
	return {
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
		child: () => mockLogger(),
	};
}

function createTestMemory(overrides?: Partial<Memory>): Memory {
	return {
		id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
		content: "Test memory content",
		embedding: new Array(768).fill(0.1),
		createdAt: new Date("2026-03-14T00:00:00Z"),
		sourceType: SourceType.Conversation,
		accessCount: 0,
		lastAccessed: null,
		significance: 0.5,
		tags: [],
		linkedIds: [],
		...overrides,
	};
}

function createInsertMock() {
	let capturedRow: unknown = null;
	const valuesMock = mock((row: unknown) => {
		capturedRow = row;
		return Promise.resolve();
	});
	const insertMock = mock(() => ({ values: valuesMock }));
	return { insertMock, valuesMock, getCapturedRow: () => capturedRow as Record<string, unknown> };
}

function createUpdateMock(
	rows: Array<{ id: string }> = [{ id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }],
) {
	let capturedSet: unknown = null;
	const returningMock = mock(() => Promise.resolve(rows));
	const whereMock = mock(() => ({ returning: returningMock }));
	const setMock = mock((args: unknown) => {
		capturedSet = args;
		return { where: whereMock };
	});
	const updateMock = mock(() => ({ set: setMock }));
	return { updateMock, setMock, getCapturedSet: () => capturedSet as Record<string, unknown> };
}

describe("MemoryStoreImpl", () => {
	describe("store()", () => {
		it("calls db.insert().values() with correctly mapped row", async () => {
			const { insertMock, valuesMock, getCapturedRow } = createInsertMock();
			const db = { insert: insertMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const memory = createTestMemory();

			const result = await store.store(memory);

			expect(result.ok).toBe(true);
			expect(insertMock).toHaveBeenCalledTimes(1);
			expect(valuesMock).toHaveBeenCalledTimes(1);

			const row = getCapturedRow();
			expect(row.id).toBe(memory.id);
			expect(row.content).toBe(memory.content);
			expect(row.embedding).toEqual(memory.embedding);
			expect(row.createdAt).toEqual(memory.createdAt);
			expect(row.sourceType).toBe("Conversation");
			expect(row.accessCount).toBe(0);
			expect(row.lastAccessed).toBeNull();
			expect(row.significance).toBe(0.5);
			expect(row.tags).toEqual([]);
			expect(row.linkedIds).toEqual([]);
		});

		it("maps SourceType enum value to string correctly", async () => {
			const capturedTypes: string[] = [];
			const valuesMock = mock((row: Record<string, unknown>) => {
				capturedTypes.push(row.sourceType as string);
				return Promise.resolve();
			});
			const insertMock = mock(() => ({ values: valuesMock }));
			const db = { insert: insertMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			for (const sourceType of [
				SourceType.Conversation,
				SourceType.Action,
				SourceType.Reflection,
				SourceType.Observation,
			]) {
				const memory = createTestMemory({ sourceType });
				await store.store(memory);
			}

			expect(capturedTypes).toEqual(["Conversation", "Action", "Reflection", "Observation"]);
		});

		it("returns MemoryStoreError on Drizzle failure", async () => {
			const insertMock = mock(() => ({
				values: mock(() => Promise.reject(new Error("unique constraint violation"))),
			}));
			const db = { insert: insertMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const memory = createTestMemory();

			const result = await store.store(memory);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MemoryStoreError);
				expect(result.error.message).toContain("unique constraint violation");
			}
		});
	});

	describe("updateSignificance()", () => {
		it("updates significance field where id matches", async () => {
			const { updateMock, getCapturedSet } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateSignificance("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", 0.8);

			expect(result.ok).toBe(true);
			expect(updateMock).toHaveBeenCalledTimes(1);
			expect(getCapturedSet().significance).toBe(0.8);
		});

		it("returns MemoryStoreError when memory not found (0 rows returned)", async () => {
			const { updateMock } = createUpdateMock([]);
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateSignificance("nonexistent-id", 0.5);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MemoryStoreError);
				expect(result.error.message).toContain("Memory not found");
			}
		});

		it("succeeds with boundary value 0.0", async () => {
			const { updateMock } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateSignificance("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", 0.0);

			expect(result.ok).toBe(true);
		});

		it("succeeds with boundary value 1.0", async () => {
			const { updateMock } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateSignificance("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", 1.0);

			expect(result.ok).toBe(true);
		});

		it("returns MemoryStoreError for out-of-range significance", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result1 = await store.updateSignificance("some-id", 1.5);
			expect(result1.ok).toBe(false);
			if (!result1.ok) {
				expect(result1.error).toBeInstanceOf(MemoryStoreError);
				expect(result1.error.message).toContain("0.0 and 1.0");
			}

			const result2 = await store.updateSignificance("some-id", -0.1);
			expect(result2.ok).toBe(false);

			const result3 = await store.updateSignificance("some-id", Number.NaN);
			expect(result3.ok).toBe(false);
		});
	});

	describe("updateTags()", () => {
		it("updates tags array where id matches", async () => {
			const { updateMock, getCapturedSet } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateTags("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", [
				"tag1",
				"tag2",
			]);

			expect(result.ok).toBe(true);
			expect(getCapturedSet().tags).toEqual(["tag1", "tag2"]);
		});

		it("succeeds with empty array (clears tags)", async () => {
			const { updateMock, getCapturedSet } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.updateTags("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", []);

			expect(result.ok).toBe(true);
			expect(getCapturedSet().tags).toEqual([]);
		});
	});

	describe("linkMemories()", () => {
		it("updates linkedIds array where id matches", async () => {
			const linkedId = "b1ffcc00-1d1b-5ef9-cc7e-7cc0ce491b22";
			const { updateMock, getCapturedSet } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.linkMemories("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", [linkedId]);

			expect(result.ok).toBe(true);
			expect(getCapturedSet().linkedIds).toEqual([linkedId]);
		});

		it("succeeds with empty array (clears links)", async () => {
			const { updateMock } = createUpdateMock();
			const db = { update: updateMock } as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.linkMemories("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", []);

			expect(result.ok).toBe(true);
		});
	});

	describe("stub read methods", () => {
		it("queryBySimilarity returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());

			const result = await store.queryBySimilarity([], 10);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toBeInstanceOf(MemoryStoreError);
				expect(result.error.message).toContain("Not implemented");
			}
		});

		it("queryRecent returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const result = await store.queryRecent(10);
			expect(result.ok).toBe(false);
		});

		it("queryRandom returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const result = await store.queryRandom();
			expect(result.ok).toBe(false);
		});

		it("queryById returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const result = await store.queryById("some-id");
			expect(result.ok).toBe(false);
		});

		it("queryLinked returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const result = await store.queryLinked("some-id");
			expect(result.ok).toBe(false);
		});

		it("compositeQuery returns MemoryStoreError", async () => {
			const db = {} as unknown as DrizzleClient;
			const store = new MemoryStoreImpl(db, mockLogger());
			const result = await store.compositeQuery(
				[],
				{ similarity: 0.5, significance: 0.3, recency: 0.2 },
				10,
			);
			expect(result.ok).toBe(false);
		});
	});
});
