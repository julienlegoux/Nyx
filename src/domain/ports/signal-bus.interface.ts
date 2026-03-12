import type { Result } from "../types/result.type.ts";
import type { TelegramQueueItem, WakeSignal } from "../types/signal.type.ts";

export interface SignalBus {
	readWakeSignals(): Promise<Result<WakeSignal[]>>;
	consumeWakeSignal(filename: string): Promise<Result<void>>;
	readTelegramQueue(): Promise<Result<TelegramQueueItem[]>>;
	consumeTelegramItem(filename: string): Promise<Result<void>>;
	writeWakeSignal(signal: WakeSignal): Promise<Result<void>>;
}
