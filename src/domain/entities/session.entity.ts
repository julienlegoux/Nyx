import { ValidationError } from "../errors/domain.error.ts";
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
	if (params.type !== params.config.type) {
		return {
			ok: false,
			error: new ValidationError(
				`Session type "${params.type}" does not match config type "${params.config.type}"`,
			),
		};
	}

	return { ok: true, value: params };
}
