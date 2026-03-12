import type { NyxError } from "../errors/domain.error.ts";

export type Result<T> = { ok: true; value: T } | { ok: false; error: NyxError };
