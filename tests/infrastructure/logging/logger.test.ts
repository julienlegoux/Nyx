import { afterAll, describe, expect, it } from "bun:test";
import { Writable } from "node:stream";
import type { Logger } from "@nyx/domain/ports/index.ts";
import { PinoLogger, createLogger } from "@nyx/infrastructure/logging/index.ts";
import pino from "pino";

function createTestLogger(): PinoLogger {
	const dest = pino.destination({ dest: "/dev/null", sync: true });
	const instance = pino({ level: "debug" }, dest);
	return new PinoLogger(instance);
}

function createCapturingDest(): { dest: Writable; chunks: string[] } {
	const chunks: string[] = [];
	const dest = new Writable({
		write(chunk: Buffer, _encoding: string, callback: () => void) {
			chunks.push(chunk.toString());
			callback();
		},
	});
	return { dest, chunks };
}

describe("PinoLogger", () => {
	it("implements Logger interface", () => {
		const logger: Logger = createTestLogger();
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.error).toBe("function");
		expect(typeof logger.debug).toBe("function");
		expect(typeof logger.child).toBe("function");
	});

	it("info does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.info("test message")).not.toThrow();
	});

	it("info with data does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.info("test message", { key: "value" })).not.toThrow();
	});

	it("warn does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.warn("test warning")).not.toThrow();
	});

	it("warn with data does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.warn("test warning", { count: 42 })).not.toThrow();
	});

	it("error does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.error("test error")).not.toThrow();
	});

	it("error with data does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.error("test error", { code: "ERR_FAIL" })).not.toThrow();
	});

	it("debug does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.debug("test debug")).not.toThrow();
	});

	it("debug with data does not throw", () => {
		const logger = createTestLogger();
		expect(() => logger.debug("test debug", { detail: true })).not.toThrow();
	});

	describe("child loggers", () => {
		it("child returns a Logger-compatible object", () => {
			const logger = createTestLogger();
			const child: Logger = logger.child("heartbeat");
			expect(typeof child.info).toBe("function");
			expect(typeof child.warn).toBe("function");
			expect(typeof child.error).toBe("function");
			expect(typeof child.debug).toBe("function");
			expect(typeof child.child).toBe("function");
		});

		it("child logger does not throw on all methods", () => {
			const logger = createTestLogger();
			const child = logger.child("daemon:consolidator");
			expect(() => child.info("test")).not.toThrow();
			expect(() => child.warn("test")).not.toThrow();
			expect(() => child.error("test")).not.toThrow();
			expect(() => child.debug("test")).not.toThrow();
		});

		it("nested child loggers work", () => {
			const logger = createTestLogger();
			const child = logger.child("consciousness");
			const nested = child.child("memory");
			expect(() => nested.info("nested log")).not.toThrow();
		});

		it("child logger includes source binding in output", () => {
			const { dest, chunks } = createCapturingDest();
			const instance = pino({ level: "debug" }, dest);
			const logger = new PinoLogger(instance);
			const child = logger.child("telegram");

			child.info("test source binding");

			expect(chunks.length).toBeGreaterThan(0);
			const parsed = JSON.parse(chunks[0] as string);
			expect(parsed.source).toBe("telegram");
			expect(parsed.msg).toBe("test source binding");
		});

		it("child logger includes data in output", () => {
			const { dest, chunks } = createCapturingDest();
			const instance = pino({ level: "debug" }, dest);
			const logger = new PinoLogger(instance);
			const child = logger.child("memory");

			child.info("store operation", { memoryId: "abc-123" });

			expect(chunks.length).toBeGreaterThan(0);
			const parsed = JSON.parse(chunks[0] as string);
			expect(parsed.source).toBe("memory");
			expect(parsed.memoryId).toBe("abc-123");
			expect(parsed.msg).toBe("store operation");
		});
	});

	describe("log output format", () => {
		it("produces JSON with timestamp, level, and msg", () => {
			const { dest, chunks } = createCapturingDest();
			const instance = pino({ level: "info" }, dest);
			const logger = new PinoLogger(instance);

			logger.info("hello world");

			expect(chunks.length).toBeGreaterThan(0);
			const parsed = JSON.parse(chunks[0] as string);
			expect(parsed.time).toBeDefined();
			expect(parsed.level).toBe(30); // pino info = 30
			expect(parsed.msg).toBe("hello world");
		});
	});
});

describe("createLogger", () => {
	const testDir = `/tmp/nyx-logger-test-${Date.now()}`;
	let logger: Logger;

	it("returns a Logger-compatible object", () => {
		logger = createLogger({ level: "debug", directory: testDir });
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.error).toBe("function");
		expect(typeof logger.debug).toBe("function");
		expect(typeof logger.child).toBe("function");
	});

	it("logger methods do not throw", () => {
		expect(() => logger.info("createLogger test")).not.toThrow();
		expect(() => logger.warn("createLogger warn")).not.toThrow();
		expect(() => logger.error("createLogger error")).not.toThrow();
		expect(() => logger.debug("createLogger debug")).not.toThrow();
	});

	it("child loggers from createLogger work", () => {
		const child = logger.child("heartbeat");
		expect(() => child.info("heartbeat test")).not.toThrow();
	});

	afterAll(() => {
		// Clean up test log directory if created
		const fs = require("node:fs");
		try {
			fs.rmSync(testDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup failures
		}
	});
});
