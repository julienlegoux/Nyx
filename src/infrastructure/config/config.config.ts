import { ConfigError } from "@nyx/domain/errors/index.ts";

export interface DatabaseConfig {
	readonly host: string;
	readonly port: number;
	readonly name: string;
	readonly user: string;
	readonly password: string;
}

export interface TelegramConfig {
	readonly botToken: string;
	readonly allowedChatId: number;
}

export interface AnthropicConfig {
	readonly apiKey: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggingConfig {
	readonly level: LogLevel;
	readonly directory: string;
}

export interface WebappConfig {
	readonly port: number;
}

export interface PathsConfig {
	readonly home: string;
	readonly signals: string;
	readonly logs: string;
}

export interface AppConfig {
	readonly database: DatabaseConfig;
	readonly telegram: TelegramConfig;
	readonly anthropic: AnthropicConfig;
	readonly logging: LoggingConfig;
	readonly webapp: WebappConfig;
	readonly paths: PathsConfig;
}

const validLogLevels: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (value === undefined || value === "") {
		throw new ConfigError(`Required environment variable ${name} is not set`);
	}
	return value;
}

function requireInt(name: string): number {
	const raw = requireEnv(name);
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || String(parsed) !== raw) {
		throw new ConfigError(`${name} must be a valid integer, got "${raw}"`);
	}
	return parsed;
}

function requirePositiveInt(name: string): number {
	const value = requireInt(name);
	if (value <= 0) {
		throw new ConfigError(`${name} must be a positive integer, got ${value}`);
	}
	return value;
}

export function loadConfig(): AppConfig {
	const logsDir = requireEnv("LOGS_DIR");

	const level = requireEnv("LOG_LEVEL");
	if (!validLogLevels.includes(level as LogLevel)) {
		throw new ConfigError(`LOG_LEVEL must be one of ${validLogLevels.join(", ")}, got "${level}"`);
	}

	return {
		database: {
			host: requireEnv("POSTGRES_HOST"),
			port: requirePositiveInt("POSTGRES_PORT"),
			name: requireEnv("POSTGRES_DB"),
			user: requireEnv("POSTGRES_USER"),
			password: requireEnv("POSTGRES_PASSWORD"),
		},
		telegram: {
			botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
			allowedChatId: requireInt("TELEGRAM_ALLOWED_CHAT_ID"),
		},
		anthropic: {
			apiKey: requireEnv("ANTHROPIC_API_KEY"),
		},
		logging: {
			level: level as LogLevel,
			directory: logsDir,
		},
		webapp: {
			port: requirePositiveInt("WEBAPP_PORT"),
		},
		paths: {
			home: requireEnv("HOME_DIR"),
			signals: requireEnv("SIGNALS_DIR"),
			logs: logsDir,
		},
	};
}
