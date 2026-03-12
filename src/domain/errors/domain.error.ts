export abstract class NyxError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class ValidationError extends NyxError {
	readonly code = "VALIDATION_ERROR";
}

export class MemoryStoreError extends NyxError {
	readonly code = "MEMORY_STORE_ERROR";
}

export class SignalBusError extends NyxError {
	readonly code = "SIGNAL_BUS_ERROR";
}

export class SkillRegistryError extends NyxError {
	readonly code = "SKILL_REGISTRY_ERROR";
}

export class IdentityStoreError extends NyxError {
	readonly code = "IDENTITY_STORE_ERROR";
}

export class SessionManagerError extends NyxError {
	readonly code = "SESSION_MANAGER_ERROR";
}

export class MessengerError extends NyxError {
	readonly code = "MESSENGER_ERROR";
}

export class EmbeddingError extends NyxError {
	readonly code = "EMBEDDING_ERROR";
}

export class ConfigError extends NyxError {
	readonly code = "CONFIG_ERROR";
}
