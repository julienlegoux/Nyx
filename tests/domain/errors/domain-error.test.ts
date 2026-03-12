import { describe, expect, test } from "bun:test";
import {
	ConfigError,
	EmbeddingError,
	IdentityStoreError,
	MemoryStoreError,
	MessengerError,
	NyxError,
	SessionManagerError,
	SignalBusError,
	SkillRegistryError,
	ValidationError,
} from "@nyx/domain/errors/domain.error.ts";

describe("NyxError hierarchy", () => {
	test("NyxError is the base class for all domain errors", () => {
		const error = new ValidationError("test");
		expect(error).toBeInstanceOf(NyxError);
		expect(error).toBeInstanceOf(Error);
	});

	const errorCases: Array<[string, new (msg: string) => NyxError, string]> = [
		["ValidationError", ValidationError, "VALIDATION_ERROR"],
		["MemoryStoreError", MemoryStoreError, "MEMORY_STORE_ERROR"],
		["SignalBusError", SignalBusError, "SIGNAL_BUS_ERROR"],
		["SkillRegistryError", SkillRegistryError, "SKILL_REGISTRY_ERROR"],
		["IdentityStoreError", IdentityStoreError, "IDENTITY_STORE_ERROR"],
		["SessionManagerError", SessionManagerError, "SESSION_MANAGER_ERROR"],
		["MessengerError", MessengerError, "MESSENGER_ERROR"],
		["EmbeddingError", EmbeddingError, "EMBEDDING_ERROR"],
		["ConfigError", ConfigError, "CONFIG_ERROR"],
	];

	for (const [name, ErrorClass, code] of errorCases) {
		test(`${name} extends NyxError with code "${code}"`, () => {
			const error = new ErrorClass(`test ${name}`);
			expect(error).toBeInstanceOf(NyxError);
			expect(error).toBeInstanceOf(Error);
			expect(error.code).toBe(code);
			expect(error.message).toBe(`test ${name}`);
			expect(error.name).toBe(name);
		});
	}
});
