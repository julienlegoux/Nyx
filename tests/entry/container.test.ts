import { describe, expect, it } from "bun:test";
import type { Logger } from "@nyx/domain/ports/index.ts";
import { createContainer } from "@nyx/entry/container.ts";
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";

function mockLogger(): Logger {
	return {
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
		child: () => mockLogger(),
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
	it("returns Container with config, logger, and skillRegistry", () => {
		const config = mockConfig();
		const logger = mockLogger();

		const container = createContainer({ config, logger });

		expect(container.config).toBe(config);
		expect(container.logger).toBe(logger);
		expect(container.skillRegistry).toBeDefined();
	});

	it("wires SkillRegistryImpl as the skillRegistry port", () => {
		const config = mockConfig();
		const logger = mockLogger();

		const container = createContainer({ config, logger });

		expect(container.skillRegistry).toBeInstanceOf(SkillRegistryImpl);
	});
});
