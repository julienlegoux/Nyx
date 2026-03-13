import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConfigError } from "@nyx/domain/errors/index.ts";
import { loadConfig } from "@nyx/infrastructure/config/index.ts";

// Env var keys that loadConfig() requires
const ENV_KEYS = [
	"ANTHROPIC_API_KEY",
	"POSTGRES_HOST",
	"POSTGRES_PORT",
	"POSTGRES_DB",
	"POSTGRES_USER",
	"POSTGRES_PASSWORD",
	"TELEGRAM_BOT_TOKEN",
	"TELEGRAM_ALLOWED_CHAT_ID",
	"WEBAPP_PORT",
	"LOG_LEVEL",
	"HOME_DIR",
	"SIGNALS_DIR",
	"LOGS_DIR",
] as const;

describe("init", () => {
	let envSnapshot: Record<string, string | undefined>;
	let tempDir: string;

	beforeEach(async () => {
		// Snapshot current env
		envSnapshot = {};
		for (const key of ENV_KEYS) {
			envSnapshot[key] = process.env[key];
		}

		// Create temp directories for paths
		tempDir = await mkdtemp(path.join(tmpdir(), "nyx-init-test-"));

		// Set all required env vars
		process.env.ANTHROPIC_API_KEY = "test-key";
		process.env.POSTGRES_HOST = "localhost";
		process.env.POSTGRES_PORT = "5432";
		process.env.POSTGRES_DB = "nyx";
		process.env.POSTGRES_USER = "nyx";
		process.env.POSTGRES_PASSWORD = "test-pass";
		process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
		process.env.TELEGRAM_ALLOWED_CHAT_ID = "12345";
		process.env.WEBAPP_PORT = "3000";
		process.env.LOG_LEVEL = "info";
		process.env.HOME_DIR = tempDir;
		process.env.SIGNALS_DIR = path.join(tempDir, "signals");
		process.env.LOGS_DIR = path.join(tempDir, "logs");
	});

	afterEach(async () => {
		// Restore env snapshot
		for (const key of ENV_KEYS) {
			const original = envSnapshot[key];
			if (original === undefined) {
				process.env[key] = "";
			} else {
				process.env[key] = original;
			}
		}

		// Clean up temp dir
		await rm(tempDir, { recursive: true, force: true }).catch(() => {});
	});

	it("loadConfig returns valid config when all env vars are set", () => {
		const config = loadConfig();

		expect(config).toBeDefined();
		expect(config.database.host).toBe("localhost");
		expect(config.database.port).toBe(5432);
		expect(config.logging.level).toBe("info");
		expect(config.paths.home).toBe(tempDir);
	});

	it("init returns Container with all expected properties", async () => {
		const { init } = await import("@nyx/entry/init.ts");
		const container = await init();

		expect(container).toBeDefined();
		expect(container.config).toBeDefined();
		expect(container.config.database.host).toBe("localhost");
		expect(container.logger).toBeDefined();
		expect(container.skillRegistry).toBeDefined();
	});

	it("throws ConfigError when a required env var is empty", () => {
		process.env.POSTGRES_HOST = "";

		expect(() => loadConfig()).toThrow(ConfigError);
	});
});
