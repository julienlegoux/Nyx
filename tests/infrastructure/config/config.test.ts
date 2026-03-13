import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ConfigError } from "@nyx/domain/errors/index.ts";
import { loadConfig } from "@nyx/infrastructure/config/index.ts";

const validEnv: Record<string, string> = {
	ANTHROPIC_API_KEY: "test-key",
	POSTGRES_HOST: "localhost",
	POSTGRES_PORT: "5432",
	POSTGRES_DB: "nyx",
	POSTGRES_USER: "nyx",
	POSTGRES_PASSWORD: "secret",
	TELEGRAM_BOT_TOKEN: "bot-token",
	TELEGRAM_ALLOWED_CHAT_ID: "12345",
	WEBAPP_PORT: "3000",
	LOG_LEVEL: "info",
	HOME_DIR: "/home/nyx",
	SIGNALS_DIR: "/app/signals",
	LOGS_DIR: "/app/logs",
};

describe("loadConfig", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = process.env;
		process.env = { ...validEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns a valid AppConfig when all env vars are set", () => {
		const config = loadConfig();

		expect(config.database.host).toBe("localhost");
		expect(config.database.port).toBe(5432);
		expect(config.database.name).toBe("nyx");
		expect(config.database.user).toBe("nyx");
		expect(config.database.password).toBe("secret");

		expect(config.telegram.botToken).toBe("bot-token");
		expect(config.telegram.allowedChatId).toBe(12345);

		expect(config.anthropic.apiKey).toBe("test-key");

		expect(config.logging.level).toBe("info");
		expect(config.logging.directory).toBe("/app/logs");

		expect(config.webapp.port).toBe(3000);

		expect(config.paths.home).toBe("/home/nyx");
		expect(config.paths.signals).toBe("/app/signals");
		expect(config.paths.logs).toBe("/app/logs");
	});

	it("logging.directory and paths.logs share the same value", () => {
		const config = loadConfig();
		expect(config.logging.directory).toBe(config.paths.logs);
	});

	describe("requireEnv — missing variables", () => {
		const requiredVars = [
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
		];

		for (const varName of requiredVars) {
			it(`throws ConfigError when ${varName} is missing`, () => {
				delete process.env[varName];
				expect(() => loadConfig()).toThrow(ConfigError);
			});

			it(`throws ConfigError when ${varName} is empty string`, () => {
				process.env[varName] = "";
				expect(() => loadConfig()).toThrow(ConfigError);
			});
		}

		it("error message includes the variable name", () => {
			process.env.ANTHROPIC_API_KEY = undefined;
			try {
				loadConfig();
				expect(true).toBe(false); // should not reach
			} catch (e) {
				expect(e).toBeInstanceOf(ConfigError);
				expect((e as ConfigError).message).toContain("ANTHROPIC_API_KEY");
			}
		});

		it("throws ConfigError when value is whitespace-only", () => {
			process.env.POSTGRES_HOST = "   ";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when API key is whitespace-only", () => {
			process.env.ANTHROPIC_API_KEY = "  \t  ";
			expect(() => loadConfig()).toThrow(ConfigError);
		});
	});

	describe("integer parsing — ports", () => {
		it("parses POSTGRES_PORT as integer", () => {
			process.env.POSTGRES_PORT = "5432";
			const config = loadConfig();
			expect(config.database.port).toBe(5432);
		});

		it("throws ConfigError when POSTGRES_PORT is NaN", () => {
			process.env.POSTGRES_PORT = "abc";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when POSTGRES_PORT is zero", () => {
			process.env.POSTGRES_PORT = "0";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when POSTGRES_PORT is negative", () => {
			process.env.POSTGRES_PORT = "-1";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when WEBAPP_PORT is NaN", () => {
			process.env.WEBAPP_PORT = "not-a-number";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when WEBAPP_PORT is zero", () => {
			process.env.WEBAPP_PORT = "0";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when WEBAPP_PORT is negative", () => {
			process.env.WEBAPP_PORT = "-5";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when port is a decimal", () => {
			process.env.POSTGRES_PORT = "3.14";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("throws ConfigError when port has trailing text", () => {
			process.env.POSTGRES_PORT = "5432abc";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("trims whitespace and accepts valid port", () => {
			process.env.WEBAPP_PORT = " 3000 ";
			const config = loadConfig();
			expect(config.webapp.port).toBe(3000);
		});
	});

	describe("integer parsing — allowedChatId", () => {
		it("parses positive chat ID", () => {
			process.env.TELEGRAM_ALLOWED_CHAT_ID = "12345";
			const config = loadConfig();
			expect(config.telegram.allowedChatId).toBe(12345);
		});

		it("allows negative chat ID (Telegram group chats)", () => {
			process.env.TELEGRAM_ALLOWED_CHAT_ID = "-100123456";
			const config = loadConfig();
			expect(config.telegram.allowedChatId).toBe(-100123456);
		});

		it("throws ConfigError when chat ID is NaN", () => {
			process.env.TELEGRAM_ALLOWED_CHAT_ID = "not-a-number";
			expect(() => loadConfig()).toThrow(ConfigError);
		});
	});

	describe("LOG_LEVEL validation", () => {
		for (const validLevel of ["debug", "info", "warn", "error"] as const) {
			it(`accepts valid level "${validLevel}"`, () => {
				process.env.LOG_LEVEL = validLevel;
				const config = loadConfig();
				expect(config.logging.level).toBe(validLevel);
			});
		}

		it("throws ConfigError for invalid level", () => {
			process.env.LOG_LEVEL = "verbose";
			expect(() => loadConfig()).toThrow(ConfigError);
		});

		it("error message lists valid levels", () => {
			process.env.LOG_LEVEL = "trace";
			try {
				loadConfig();
				expect(true).toBe(false);
			} catch (e) {
				expect(e).toBeInstanceOf(ConfigError);
				const msg = (e as ConfigError).message;
				expect(msg).toContain("debug");
				expect(msg).toContain("info");
				expect(msg).toContain("warn");
				expect(msg).toContain("error");
				expect(msg).toContain("trace");
			}
		});
	});
});
