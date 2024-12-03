DROP INDEX IF EXISTS "movies_tmbd_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "movies_imdb_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "series_tmdb_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "series_imdb_id_idx";--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id");--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_imdb_id_unique" UNIQUE("imdb_id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_tmdb_id_unique" UNIQUE("tmdb_id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_imdb_id_unique" UNIQUE("imdb_id");