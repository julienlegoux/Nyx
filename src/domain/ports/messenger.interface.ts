import type { Result } from "../types/result.type.ts";

export interface Messenger {
	sendMessage(chatId: number, text: string): Promise<Result<void>>;
}
