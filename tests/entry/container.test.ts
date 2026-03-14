import { describe, expect, it } from "bun:test";
import type { EmbeddingProvider, Logger } from "@nyx/domain/ports/index.ts";
import { createContainer } from "@nyx/entry/container.ts";
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import type { DrizzleClient } from "@nyx/infrastructure/database/index.ts";
import { MemoryStoreImpl } from "@nyx/infrastructure/database/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";
import type { Pool } from "pg";

function mockLogger(): Logger {
	return {
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
		child: () => mockLogger(),
	};
}

function mockDb(): DrizzleClient {
	return {} as unknown as DrizzleClient;
}

function mockPool(): Pool {
	return { end: () => Promise.resolve() } as unknown as Pool;
}

function mockEmbeddingProvider(): EmbeddingProvider {
	return {
		embed: () => Promise.resolve({ ok: true as const, value: [] }),
	};
}

function mockConfig(): AppConfig {
	return {
		database: {
			host: "localhost",
			port: 5432,
			name: "nyx",
			user: "nyx",
			password: "test",
		},
		telegram: {
			botToken: "test-token",
			allowedChatId: 12345,
		},
		anthropic: {
			apiKey: "test-key",
		},
		logging: {
			level: "info",
			directory: "/tmp/nyx-test-logs",
		},
		webapp: {
			port: 3000,
		},
		paths: {
			home: "/tmp/nyx-test-home",
			signals: "/tmp/nyx-test-signals",
			logs: "/tmp/nyx-test-logs",
		},
	};
}

describe("createContainer", () => {
	it("returns Container with all expected properties", () => {
		const config = mockConfig();
		const db = mockDb();
		const dbPool = mockPool();
		const embeddingProvider = mockEmbeddingProvider();
		const logger = mockLogger();

		const container = createContainer({ config, db, dbPool, embeddingProvider, logger });

		expect(container.config).toBe(config);
		expect(container.db).toBe(db);
		expect(container.dbPool).toBe(dbPool);
		expect(container.embeddingProvider).toBe(embeddingProvider);
		expect(container.logger).toBe(logger);
		expect(container.memoryStore).toBeDefined();
		expect(container.skillRegistry).toBeDefined();
	});

	it("wires SkillRegistryImpl as the skillRegistry port", () => {
		const config = mockConfig();
		const db = mockDb();
		const dbPool = mockPool();
		const embeddingProvider = mockEmbeddingProvider();
		const logger = mockLogger();

		const container = createContainer({ config, db, dbPool, embeddingProvider, logger });

		expect(container.skillRegistry).toBeInstanceOf(SkillRegistryImpl);
	});

	it("wires MemoryStoreImpl as the memoryStore port", () => {
		const config = mockConfig();
		const db = mockDb();
		const dbPool = mockPool();
		const embeddingProvider = mockEmbeddingProvider();
		const logger = mockLogger();

		const container = createContainer({ config, db, dbPool, embeddingProvider, logger });

		expect(container.memoryStore).toBeInstanceOf(MemoryStoreImpl);
	});
});
