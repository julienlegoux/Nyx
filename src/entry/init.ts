import { loadConfig } from "@nyx/infrastructure/config/index.ts";
import { connectDatabase, runMigrations } from "@nyx/infrastructure/database/index.ts";
import { createLogger } from "@nyx/infrastructure/logging/index.ts";
import { type Container, createContainer } from "./container.ts";

export async function init(): Promise<Container> {
	const config = loadConfig();
	const logger = createLogger(config.logging);
	logger.info("Nyx booting");
	const { db, pool } = connectDatabase(config.database);
	await runMigrations(db);
	const container = createContainer({ config, db, dbPool: pool, logger });
	return container;
}
