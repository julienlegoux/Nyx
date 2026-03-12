import type { Result } from "../types/result.type.ts";
import type { SessionConfig, SessionType } from "../types/session.type.ts";

export interface SessionEntity {
	type: SessionType;
	config: SessionConfig;
	startedAt: Date;
	triggerContext: string;
}

export function createSessionEntity(params: {
	type: SessionType;
	config: SessionConfig;
	startedAt: Date;
	triggerContext: string;
}): Result<SessionEntity> {
	return { ok: true, value: params };
}
