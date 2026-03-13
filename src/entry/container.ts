import type { Logger, SkillRegistry } from "@nyx/domain/ports/index.ts";
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import type { DrizzleClient } from "@nyx/infrastructure/database/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";
import type { Pool } from "pg";

export interface Container {
	readonly config: AppConfig;
	readonly db: DrizzleClient;
	readonly dbPool: Pool;
	readonly logger: Logger;
	readonly skillRegistry: SkillRegistry;
}

export interface InitDeps {
	readonly config: AppConfig;
	readonly db: DrizzleClient;
	readonly dbPool: Pool;
	readonly logger: Logger;
}

export function createContainer(deps: InitDeps): Container {
	const skillRegistry = new SkillRegistryImpl(deps.config.paths.home);

	return {
		config: deps.config,
		db: deps.db,
		dbPool: deps.dbPool,
		logger: deps.logger,
		skillRegistry,
	};
}
