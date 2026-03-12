import type { Result } from "../types/result.type.ts";

export interface IdentityStore {
	read(): Promise<Result<string>>;
	write(content: string): Promise<Result<void>>;
}
