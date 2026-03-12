import type { Result } from "../types/result.type.ts";
import type { SessionConfig, SessionType } from "../types/session.type.ts";

export interface SessionManager {
	spawnDaemon(type: SessionType, config: SessionConfig): Promise<Result<void>>;
	spawnConsciousness(config: SessionConfig, triggerContext: string): Promise<Result<void>>;
	isConsciousnessActive(): Promise<Result<boolean>>;
}
