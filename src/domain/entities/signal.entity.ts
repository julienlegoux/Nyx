import { uuidPattern } from "../constants.ts";
import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";
import type { TelegramQueueItem, WakeSignal } from "../types/signal.type.ts";

export interface WakeSignalEntity extends WakeSignal {}

export interface TelegramQueueItemEntity extends TelegramQueueItem {}

export function createWakeSignalEntity(params: WakeSignal): Result<WakeSignalEntity> {
	if (!params.source.trim()) {
		return {
			ok: false,
			error: new ValidationError("WakeSignal source must be non-empty"),
		};
	}
	if (!params.reason.trim()) {
		return {
			ok: false,
			error: new ValidationError("WakeSignal reason must be non-empty"),
		};
	}
	if (!params.createdAt.trim()) {
		return {
			ok: false,
			error: new ValidationError("WakeSignal createdAt must be non-empty"),
		};
	}

	for (const memoryId of params.relatedMemories) {
		if (!uuidPattern.test(memoryId)) {
			return {
				ok: false,
				error: new ValidationError(`relatedMemories must contain valid UUIDs, got "${memoryId}"`),
			};
		}
	}

	return {
		ok: true,
		value: {
			...params,
			relatedMemories: [...params.relatedMemories],
		},
	};
}

export function createTelegramQueueItemEntity(
	params: TelegramQueueItem,
): Result<TelegramQueueItemEntity> {
	if (!params.from.trim()) {
		return {
			ok: false,
			error: new ValidationError("TelegramQueueItem from must be non-empty"),
		};
	}
	if (!params.receivedAt.trim()) {
		return {
			ok: false,
			error: new ValidationError("TelegramQueueItem receivedAt must be non-empty"),
		};
	}

	if (!Number.isInteger(params.chatId)) {
		return {
			ok: false,
			error: new ValidationError(
				`TelegramQueueItem chatId must be an integer, got ${params.chatId}`,
			),
		};
	}

	if (!Number.isInteger(params.messageId) || params.messageId <= 0) {
		return {
			ok: false,
			error: new ValidationError(
				`TelegramQueueItem messageId must be a positive integer, got ${params.messageId}`,
			),
		};
	}

	return { ok: true, value: { ...params } };
}
