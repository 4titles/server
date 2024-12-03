CREATE TABLE IF NOT EXISTS "series" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "series_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tmdb_id" integer NOT NULL,
	"imdb_id" text NOT NULL,
	"adult" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"poster_path" text,
	"backdrop_path" text,
	"created_by" jsonb NOT NULL,
	"episode_run_time" jsonb DEFAULT '[]'::jsonb,
	"first_air_date" date,
	"genres" jsonb NOT NULL,
	"homepage" text,
	"in_production" boolean DEFAULT false NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"last_air_date" date,
	"networks" jsonb NOT NULL,
	"number_of_episodes" integer DEFAULT 0,
	"number_of_seasons" integer DEFAULT 0,
	"origin_country" jsonb NOT NULL,
	"original_language" text NOT NULL,
	"overview" text NOT NULL,
	"popularity" real DEFAULT 0,
	"production_companies" jsonb NOT NULL,
	"production_countries" jsonb NOT NULL,
	"spoken_languages" jsonb NOT NULL,
	"status" text NOT NULL,
	"tag_line" text,
	"vote_average" real DEFAULT 0,
	"vote_count" integer DEFAULT 0,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "deleted_at" timestamp;