import type { Logger, SkillRegistry } from "@nyx/domain/ports/index.ts";
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";

export interface Container {
	readonly config: AppConfig;
	readonly logger: Logger;
	readonly skillRegistry: SkillRegistry;
}

export interface InitDeps {
	readonly config: AppConfig;
	readonly logger: Logger;
}

export function createContainer(deps: InitDeps): Container {
	const skillRegistry = new SkillRegistryImpl(deps.config.paths.home);

	return {
		config: deps.config,
		logger: deps.logger,
		skillRegistry,
	};
}
