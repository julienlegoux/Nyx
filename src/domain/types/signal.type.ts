export interface WakeSignal {
	source: string;
	reason: string;
	urgency: "low" | "medium" | "high";
	relatedMemories: string[];
	createdAt: string;
}

export interface TelegramQueueItem {
	chatId: number;
	messageId: number;
	text: string;
	from: string;
	receivedAt: string;
}
