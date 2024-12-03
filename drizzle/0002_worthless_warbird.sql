CREATE TYPE "public"."movie_status" AS ENUM('Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled');--> statement-breakpoint
ALTER TABLE "movies" ALTER COLUMN "status" SET DATA TYPE movie_status;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "original_name" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "movies_tmbd_id_idx" ON "movies" USING btree ("tmdb_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "movies_imdb_id_idx" ON "movies" USING btree ("imdb_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_title_idx" ON "movies" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_popularity_rating_idx" ON "movies" USING btree ("popularity","vote_average");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_release_date_idx" ON "movies" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_status_idx" ON "movies" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movies_original_language_idx" ON "movies" USING btree ("original_language");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "series_tmdb_id_idx" ON "series" USING btree ("tmdb_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "series_imdb_id_idx" ON "series" USING btree ("imdb_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_title_idx" ON "series" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_popularity_rating_idx" ON "series" USING btree ("popularity","vote_average");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_first_air_date_idx" ON "series" USING btree ("first_air_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_last_air_date_idx" ON "series" USING btree ("last_air_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_status_production_idx" ON "series" USING btree ("status","in_production");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "series_original_language_idx" ON "series" USING btree ("original_language");