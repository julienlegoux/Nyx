import { loadConfig } from "@nyx/infrastructure/config/index.ts";
import { createLogger } from "@nyx/infrastructure/logging/index.ts";
import { type Container, createContainer } from "./container.ts";

export async function init(): Promise<Container> {
	const config = loadConfig();
	const logger = createLogger(config.logging);
	logger.info("Nyx booting");
	const container = createContainer({ config, logger });
	return container;
}
