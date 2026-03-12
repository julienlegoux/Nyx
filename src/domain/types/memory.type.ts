export enum SourceType {
	Conversation = "Conversation",
	Action = "Action",
	Reflection = "Reflection",
	Observation = "Observation",
}

export interface RetrievalWeights {
	similarity: number;
	significance: number;
	recency: number;
}

export interface Memory {
	id: string;
	content: string;
	embedding: number[];
	createdAt: Date;
	sourceType: SourceType;
	accessCount: number;
	lastAccessed: Date | null;
	significance: number;
	tags: string[];
	linkedIds: string[];
}
