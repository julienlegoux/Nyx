import { describe, expect, test } from "bun:test";
import {
	createTelegramQueueItemEntity,
	createWakeSignalEntity,
} from "@nyx/domain/entities/signal.entity.ts";

const validUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("WakeSignalEntity factory", () => {
	test("creates entity from valid params", () => {
		const result = createWakeSignalEntity({
			source: "telegram",
			reason: "new message",
			urgency: "medium",
			relatedMemories: [validUuid],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.source).toBe("telegram");
			expect(result.value.urgency).toBe("medium");
			expect(result.value.relatedMemories).toEqual([validUuid]);
		}
	});

	test("creates entity with empty relatedMemories", () => {
		const result = createWakeSignalEntity({
			source: "heartbeat",
			reason: "scheduled wake",
			urgency: "low",
			relatedMemories: [],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.relatedMemories).toEqual([]);
		}
	});

	test("creates entity with high urgency", () => {
		const result = createWakeSignalEntity({
			source: "user",
			reason: "direct mention",
			urgency: "high",
			relatedMemories: [],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.urgency).toBe("high");
		}
	});

	test("rejects empty source", () => {
		const result = createWakeSignalEntity({
			source: "",
			reason: "new message",
			urgency: "medium",
			relatedMemories: [],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("source");
		}
	});

	test("rejects empty reason", () => {
		const result = createWakeSignalEntity({
			source: "telegram",
			reason: "",
			urgency: "medium",
			relatedMemories: [],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("reason");
		}
	});

	test("defensively copies relatedMemories array", () => {
		const memories = [validUuid];
		const result = createWakeSignalEntity({
			source: "telegram",
			reason: "new message",
			urgency: "medium",
			relatedMemories: memories,
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			memories.push("mutated-value");
			expect(result.value.relatedMemories).toEqual([validUuid]);
			expect(result.value.relatedMemories).toHaveLength(1);
		}
	});

	test("returns a new object, not the input reference", () => {
		const params = {
			source: "telegram",
			reason: "new message",
			urgency: "medium" as const,
			relatedMemories: [validUuid],
			createdAt: "2026-03-12T00:00:00Z",
		};
		const result = createWakeSignalEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBe(params);
		}
	});

	test("rejects non-UUID relatedMemories entry", () => {
		const result = createWakeSignalEntity({
			source: "telegram",
			reason: "new message",
			urgency: "medium",
			relatedMemories: ["not-a-uuid"],
			createdAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("UUID");
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

	test("accepts empty text (valid message)", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345,
			messageId: 1,
			text: "",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
	});

	test("rejects empty from", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345,
			messageId: 1,
			text: "hello",
			from: "",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("from");
		}
	});

	test("returns a new object, not the input reference", () => {
		const params = {
			chatId: 12345,
			messageId: 1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		};
		const result = createTelegramQueueItemEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBe(params);
		}
	});

	test("rejects NaN chatId", () => {
		const result = createTelegramQueueItemEntity({
			chatId: Number.NaN,
			messageId: 1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("chatId");
		}
	});

	test("rejects non-integer chatId", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345.5,
			messageId: 1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("chatId");
		}
	});

	test("accepts negative chatId (group chats)", () => {
		const result = createTelegramQueueItemEntity({
			chatId: -100123456789,
			messageId: 1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(true);
	});

	test("rejects zero messageId", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345,
			messageId: 0,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("messageId");
		}
	});

	test("rejects negative messageId", () => {
		const result = createTelegramQueueItemEntity({
			chatId: 12345,
			messageId: -1,
			text: "hello",
			from: "user",
			receivedAt: "2026-03-12T00:00:00Z",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("messageId");
		}
	});
});
