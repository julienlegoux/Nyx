import { describe, expect, test } from "bun:test";
import {
	createTelegramQueueItemEntity,
	createWakeSignalEntity,
} from "@nyx/domain/entities/signal.entity.ts";

describe("WakeSignalEntity factory", () => {
	test("creates entity from valid params", () => {
		const result = createWakeSignalEntity({
			source: "telegram",
			reason: "new message",
			urgency: "medium",
			relatedMemories: ["mem-1"],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.source).toBe("telegram");
			expect(result.value.urgency).toBe("medium");
		}
	});
});

describe("TelegramQueueItemEntity factory", () => {
	test("creates entity from valid params", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345,
			messageId: 1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.chatId).toBe(12345);
			expect(result.value.text).toBe("hello");
		}
	});
});
