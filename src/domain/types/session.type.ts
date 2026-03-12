export enum SessionType {
	DaemonConsolidator = "DaemonConsolidator",
	DaemonPatternDetector = "DaemonPatternDetector",
	Consciousness = "Consciousness",
}

export interface SessionConfig {
	type: SessionType;
	model: string;
	systemPrompt: string;
	// TODO: Narrow to Agent SDK tool type in Story 3.3
	tools: unknown[];
	maxTurns: number | null;
}
