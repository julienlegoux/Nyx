import type { Result } from "../types/result.type.ts";
import type { TelegramQueueItem, WakeSignal } from "../types/signal.type.ts";

export type WakeSignalEntity = WakeSignal;

export type TelegramQueueItemEntity = TelegramQueueItem;

export function createWakeSignalEntity(params: WakeSignal): Result<WakeSignalEntity> {
	return { ok: true, value: params };
}

export function createTelegramQueueItemEntity(
	params: TelegramQueueItem,
): Result<TelegramQueueItemEntity> {
	return { ok: true, value: params };
}
