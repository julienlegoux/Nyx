import type {
	EmbeddingProvider,
	Logger,
	MemoryStore,
	SkillRegistry,
} from "@nyx/domain/ports/index.ts";
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import { MemoryStoreImpl } from "@nyx/infrastructure/database/index.ts";
import type { DrizzleClient } from "@nyx/infrastructure/database/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";
import type { Pool } from "pg";

export interface Container {
	readonly config: AppConfig;
	readonly db: DrizzleClient;
	readonly dbPool: Pool;
	readonly embeddingProvider: EmbeddingProvider;
	readonly logger: Logger;
	readonly memoryStore: MemoryStore;
	readonly skillRegistry: SkillRegistry;
}

export interface InitDeps {
	readonly config: AppConfig;
	readonly db: DrizzleClient;
	readonly dbPool: Pool;
	readonly embeddingProvider: EmbeddingProvider;
	readonly logger: Logger;
}

export function createContainer(deps: InitDeps): Container {
	const memoryStore = new MemoryStoreImpl(deps.db, deps.logger);
	const skillRegistry = new SkillRegistryImpl(deps.config.paths.home);

	return {
		config: deps.config,
		db: deps.db,
		dbPool: deps.dbPool,
		embeddingProvider: deps.embeddingProvider,
		logger: deps.logger,
		memoryStore,
		skillRegistry,
	};
}
