import { ValidationError } from "../errors/domain.error.ts";
import type { Result } from "../types/result.type.ts";
import type { TelegramQueueItem, WakeSignal } from "../types/signal.type.ts";

export type WakeSignalEntity = WakeSignal;

export type TelegramQueueItemEntity = TelegramQueueItem;

export function createWakeSignalEntity(params: WakeSignal): Result<WakeSignalEntity> {
	if (!params.source) {
		return {
			ok: false,
			error: new ValidationError("WakeSignal source must be non-empty"),
		};
	}
	if (!params.reason) {
		return {
			ok: false,
			error: new ValidationError("WakeSignal reason must be non-empty"),
		};
	}

	return { ok: true, value: params };
}

export function createTelegramQueueItemEntity(
	params: TelegramQueueItem,
): Result<TelegramQueueItemEntity> {
	if (!params.text && params.text !== "") {
		return {
			ok: false,
			error: new ValidationError("TelegramQueueItem text must be a string"),
		};
	}

	return { ok: true, value: params };
}
