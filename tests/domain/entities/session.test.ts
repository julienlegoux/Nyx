import { describe, expect, test } from "bun:test";
import { createSessionEntity } from "@nyx/domain/entities/session.entity.ts";
import { SessionType } from "@nyx/domain/types/session.type.ts";

describe("SessionEntity factory", () => {
	const validConfig = {
		type: SessionType.Consciousness,
		model: "claude-sonnet-4-6",
		systemPrompt: "You are Nyx",
		tools: [],
		maxTurns: null,
	};

	test("creates entity from valid params", () => {
		const now = new Date();
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: { ...validConfig },
			startedAt: now,
			triggerContext: "wake signal received",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SessionType.Consciousness);
			expect(result.value.startedAt).toEqual(now);
			expect(result.value.triggerContext).toBe("wake signal received");
		}
	});

	test("creates entity for DaemonConsolidator type", () => {
		const result = createSessionEntity({
			type: SessionType.DaemonConsolidator,
			config: {
				...validConfig,
				type: SessionType.DaemonConsolidator,
			},
			startedAt: new Date(),
			triggerContext: "scheduled consolidation",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SessionType.DaemonConsolidator);
		}
	});

	test("creates entity for DaemonPatternDetector type", () => {
		const result = createSessionEntity({
			type: SessionType.DaemonPatternDetector,
			config: {
				...validConfig,
				type: SessionType.DaemonPatternDetector,
			},
			startedAt: new Date(),
			triggerContext: "pattern analysis trigger",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.type).toBe(SessionType.DaemonPatternDetector);
		}
	});

	test("creates entity with non-null maxTurns", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				...validConfig,
				maxTurns: 10,
			},
			startedAt: new Date(),
			triggerContext: "limited session",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.config.maxTurns).toBe(10);
		}
	});

	test("creates entity with tools in config", () => {
		const tools = [{ name: "search" }, { name: "write" }];
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				...validConfig,
				tools,
			},
			startedAt: new Date(),
			triggerContext: "tooled session",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.config.tools).toHaveLength(2);
		}
	});

	test("rejects when type does not match config.type", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				...validConfig,
				type: SessionType.DaemonConsolidator,
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

	test("defensively copies config.tools array", () => {
		const tools = [{ name: "search" }];
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: {
				...validConfig,
				tools,
			},
			startedAt: new Date(),
			triggerContext: "wake signal",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			tools.push({ name: "mutated" });
			expect(result.value.config.tools).toHaveLength(1);
		}
	});

	test("defensively copies config object", () => {
		const config = {
			...validConfig,
		};
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config,
			startedAt: new Date(),
			triggerContext: "wake signal",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			config.model = "mutated-model";
			expect(result.value.config.model).toBe("claude-sonnet-4-6");
		}
	});

	test("returns a new object, not the input reference", () => {
		const params = {
			type: SessionType.Consciousness,
			config: { ...validConfig },
			startedAt: new Date(),
			triggerContext: "wake signal",
		};
		const result = createSessionEntity(params);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).not.toBe(params);
		}
	});

	test("defensively copies startedAt Date", () => {
		const startedAt = new Date();
		const originalTime = startedAt.getTime();
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: { ...validConfig },
			startedAt,
			triggerContext: "wake signal",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			startedAt.setTime(0);
			expect(result.value.startedAt.getTime()).toBe(originalTime);
			expect(result.value.startedAt).not.toBe(startedAt);
		}
	});

	test("rejects empty triggerContext", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: { ...validConfig },
			startedAt: new Date(),
			triggerContext: "",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("triggerContext");
		}
	});

	test("rejects empty config.model", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: { ...validConfig, model: "" },
			startedAt: new Date(),
			triggerContext: "wake signal",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("model");
		}
	});

	test("rejects empty config.systemPrompt", () => {
		const result = createSessionEntity({
			type: SessionType.Consciousness,
			config: { ...validConfig, systemPrompt: "" },
			startedAt: new Date(),
			triggerContext: "wake signal",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("VALIDATION_ERROR");
			expect(result.error.message).toContain("systemPrompt");
		}
	});
});
