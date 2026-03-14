import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { Logger } from "@nyx/domain/ports/index.ts";
import type { Container } from "@nyx/entry/container.ts";
import { shutdown } from "@nyx/entry/shutdown.ts";
import type { DrizzleClient } from "@nyx/infrastructure/database/index.ts";
import type { Pool } from "pg";

function mockLogger(): Logger & { calls: string[] } {
	const calls: string[] = [];
	const logger: Logger & { calls: string[] } = {
		calls,
		info: (message: string) => {
			calls.push(message);
		},
		warn: () => {},
		error: () => {},
		debug: () => {},
		child: () => mockLogger(),
	};
	return logger;
}

function mockContainer(logger: Logger): Container {
	return {
		config: {} as Container["config"],
		db: {} as unknown as DrizzleClient,
		dbPool: { end: mock(() => Promise.resolve()) } as unknown as Pool,
		embeddingProvider: { embed: () => Promise.resolve({ ok: true as const, value: [] }) },
		logger,
		memoryStore: {} as Container["memoryStore"],
		skillRegistry: {} as Container["skillRegistry"],
	};
}

describe("shutdown", () => {
	let exitSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		exitSpy = spyOn(process, "exit").mockImplementation(() => {
			// Prevent actual exit
			return undefined as never;
		});
	});

	afterEach(() => {
		exitSpy.mockRestore();
	});

	it("logs shutdown message", async () => {
		const logger = mockLogger();
		const container = mockContainer(logger);

		await shutdown(container);

		expect(logger.calls).toContain("Nyx shutting down");
	});

	it("closes database pool", async () => {
		const logger = mockLogger();
		const container = mockContainer(logger);

		await shutdown(container);

		expect(container.dbPool.end).toHaveBeenCalled();
	});

	it("logs database pool closed", async () => {
		const logger = mockLogger();
		const container = mockContainer(logger);

		await shutdown(container);

		expect(logger.calls).toContain("database pool closed");
	});

	it("calls process.exit(0)", async () => {
		const logger = mockLogger();
		const container = mockContainer(logger);

		await shutdown(container);

		expect(exitSpy).toHaveBeenCalledWith(0);
	});
});
