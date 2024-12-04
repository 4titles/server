CREATE TYPE "public"."movie_status" AS ENUM('Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled');--> statement-breakpoint
CREATE TYPE "public"."title_category" AS ENUM('POPULAR', 'TOP_RATED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "movies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tmdb_id" integer NOT NULL,
	"imdb_id" text NOT NULL,
	"adult" boolean DEFAULT false NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"backdrop_path" text,
	"budget" integer DEFAULT 0,
	"genres" jsonb NOT NULL,
	"homepage" text,
	"origin_country" jsonb NOT NULL,
	"original_language" text NOT NULL,
	"original_title" text NOT NULL,
	"overview" text NOT NULL,
	"production_companies" jsonb NOT NULL,
	"production_countries" jsonb NOT NULL,
	"release_date" date,
	"revenue" integer DEFAULT 0,
	"runtime" integer DEFAULT 0,
	"spoken_languages" jsonb NOT NULL,
	"status" "movie_status" NOT NULL,
	"tag_line" text,
	"popularity" real DEFAULT 0,
	"vote_average" real DEFAULT 0,
	"vote_count" integer DEFAULT 0,
	"category" "title_category" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id"),
	CONSTRAINT "movies_imdb_id_unique" UNIQUE("imdb_id")
);
--> statement-breakpoint
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
	"original_name" text,
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
	"category" "title_category" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "series_tmdb_id_unique" UNIQUE("tmdb_id"),
	CONSTRAINT "series_imdb_id_unique" UNIQUE("imdb_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_title_idx" ON "movies" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_popularity_rating_idx" ON "movies" USING btree ("popularity","vote_average");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_release_date_idx" ON "movies" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_status_idx" ON "movies" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_original_language_idx" ON "movies" USING btree ("original_language");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_title_idx" ON "series" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_popularity_rating_idx" ON "series" USING btree ("popularity","vote_average");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_first_air_date_idx" ON "series" USING btree ("first_air_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_last_air_date_idx" ON "series" USING btree ("last_air_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_status_production_idx" ON "series" USING btree ("status","in_production");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_original_language_idx" ON "series" USING btree ("original_language");