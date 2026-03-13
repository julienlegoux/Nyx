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

	if (!params.triggerContext) {
		return {
			ok: false,
			error: new ValidationError("Session triggerContext must be non-empty"),
		};
	}

	if (!params.config.model) {
		return {
			ok: false,
			error: new ValidationError("SessionConfig model must be non-empty"),
		};
	}

	if (!params.config.systemPrompt) {
		return {
			ok: false,
			error: new ValidationError("SessionConfig systemPrompt must be non-empty"),
		};
	}

	if (
		params.config.maxTurns !== null &&
		(!Number.isInteger(params.config.maxTurns) || params.config.maxTurns <= 0)
	) {
		return {
			ok: false,
			error: new ValidationError(
				`SessionConfig maxTurns must be a positive integer or null, got ${params.config.maxTurns}`,
			),
		};
	}

	return {
		ok: true,
		value: {
			...params,
			startedAt: new Date(params.startedAt.getTime()),
			config: {
				...params.config,
				tools: [...params.config.tools],
			},
		},
	};
}
