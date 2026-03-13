import path from "node:path";
import type { Logger } from "@nyx/domain/ports/index.ts";
import type { LoggingConfig } from "@nyx/infrastructure/config/index.ts";
import pino from "pino";

export class PinoLogger implements Logger {
	constructor(private readonly instance: pino.Logger) {}

	info(message: string, data?: Record<string, unknown>): void {
		if (data) {
			this.instance.info(data, message);
		} else {
			this.instance.info(message);
		}
	}

	warn(message: string, data?: Record<string, unknown>): void {
		if (data) {
			this.instance.warn(data, message);
		} else {
			this.instance.warn(message);
		}
	}

	error(message: string, data?: Record<string, unknown>): void {
		if (data) {
			this.instance.error(data, message);
		} else {
			this.instance.error(message);
		}
	}

	debug(message: string, data?: Record<string, unknown>): void {
		if (data) {
			this.instance.debug(data, message);
		} else {
			this.instance.debug(message);
		}
	}

	child(source: string): Logger {
		return new PinoLogger(this.instance.child({ source }));
	}
}

export function createLogger(config: LoggingConfig): Logger {
	const pinoInstance = pino({
		level: config.level,
		transport: {
			targets: [
				{
					target: "pino/file",
					level: config.level,
					options: { destination: 1 },
				},
				{
					target: "pino-roll",
					level: config.level,
					options: {
						file: path.join(config.directory, "nyx"),
						frequency: "daily",
						mkdir: true,
					},
				},
			],
		},
	});

	return new PinoLogger(pinoInstance);
}
