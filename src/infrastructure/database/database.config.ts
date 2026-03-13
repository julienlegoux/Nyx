import type { DatabaseConfig } from "@nyx/infrastructure/config/index.ts";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema/index.ts";

export type DrizzleClient = NodePgDatabase<typeof schema>;

export interface DatabaseConnection {
	readonly db: DrizzleClient;
	readonly pool: pg.Pool;
}

export function connectDatabase(config: DatabaseConfig): DatabaseConnection {
	const pool = new pg.Pool({
		host: config.host,
		port: config.port,
		database: config.name,
		user: config.user,
		password: config.password,
	});
	const db = drizzle({ client: pool, schema });
	return { db, pool };
}

export async function runMigrations(db: DrizzleClient): Promise<void> {
	await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
	await migrate(db, { migrationsFolder: "./src/infrastructure/database/migrations" });
}
