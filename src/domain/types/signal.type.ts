// Temporal fields use ISO-8601 strings (not Date) because signals are
// serialized as JSON files for filesystem IPC. Date parsing happens at
// the infrastructure boundary. See Memory type for the DB-backed Date variant.
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
