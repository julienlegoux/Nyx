CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_type" varchar(20) NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed" timestamp with time zone,
	"significance" real DEFAULT 0.5 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"linked_ids" uuid[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_memories_embedding" ON "memories" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_memories_created_at" ON "memories" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_memories_significance" ON "memories" USING btree ("significance" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_memories_source_type" ON "memories" USING btree ("source_type");