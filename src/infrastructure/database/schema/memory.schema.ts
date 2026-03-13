import { sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	real,
	text,
	timestamp,
	uuid,
	varchar,
	vector,
} from "drizzle-orm/pg-core";

export const memories = pgTable(
	"memories",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		content: text("content").notNull(),
		embedding: vector("embedding", { dimensions: 768 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		sourceType: varchar("source_type", { length: 20 }).notNull(),
		accessCount: integer("access_count").notNull().default(0),
		lastAccessed: timestamp("last_accessed", { withTimezone: true }),
		significance: real("significance").notNull().default(0.5),
		tags: text("tags").array().notNull().default(sql`'{}'`),
		linkedIds: uuid("linked_ids").array().notNull().default(sql`'{}'`),
	},
	(table) => [
		index("idx_memories_embedding").using("hnsw", table.embedding.op("vector_cosine_ops")),
		index("idx_memories_created_at").on(table.createdAt.desc()),
		index("idx_memories_significance").on(table.significance.desc()),
		index("idx_memories_source_type").on(table.sourceType),
	],
);
