import { describe, expect, test } from "bun:test";
import { createSessionEntity } from "@nyx/domain/entities/session.entity.ts";
import { SessionType } from "@nyx/domain/types/session.type.ts";

describe("SessionEntity factory", () => {
	test("creates entity from valid params", () => {
		const now = new Date();
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				type: SessionType.Consciousness,
				model: "claude-sonnet-4-6",
				systemPrompt: "You are Nyx",
				tools: [],
				maxTurns: null,
			},
			startedAt: now,
			triggerContext: "wake signal received",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SessionType.Consciousness);
			expect(result.value.startedAt).toBe(now);
			expect(result.value.triggerContext).toBe("wake signal received");
		}
	});

	test("rejects when type does not match config.type", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				type: SessionType.DaemonConsolidator,
				model: "claude-sonnet-4-6",
				systemPrompt: "You are Nyx",
				tools: [],
				maxTurns: null,
			},
			startedAt: new Date(),
			triggerContext: "wake signal received",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("does not match");
		}
	});
});
