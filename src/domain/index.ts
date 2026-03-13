export {
	type Memory,
	type RetrievalWeights,
	SourceType,
	type TelegramQueueItem,
	type WakeSignal,
	type SessionConfig,
	SessionType,
	type Skill,
	SkillStatus,
	SkillType,
	type Result,
} from "./types/index.ts";

export {
	type MemoryEntity,
	createMemoryEntity,
	type WakeSignalEntity,
	createWakeSignalEntity,
	type TelegramQueueItemEntity,
	createTelegramQueueItemEntity,
	type SkillEntity,
	createSkillEntity,
	type SessionEntity,
	createSessionEntity,
	type IdentityEntity,
	createIdentityEntity,
} from "./entities/index.ts";

export {
	type Embedding,
	createEmbedding,
	embeddingDimensions,
	type Significance,
	createSignificance,
	createRetrievalWeights,
} from "./value-objects/index.ts";

export type {
	MemoryStore,
	SignalBus,
	SkillRegistry,
	IdentityStore,
	SessionManager,
	Messenger,
	EmbeddingProvider,
	Logger,
} from "./ports/index.ts";

export {
	NyxError,
	ValidationError,
	MemoryStoreError,
	SignalBusError,
	SkillRegistryError,
	IdentityStoreError,
	SessionManagerError,
	MessengerError,
	EmbeddingError,
	ConfigError,
} from "./errors/index.ts";
