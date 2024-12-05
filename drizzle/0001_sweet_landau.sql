ALTER TYPE "public"."title_category" ADD VALUE 'TRENDING';--> statement-breakpoint
ALTER TABLE "movies" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "movies" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "movies" ALTER COLUMN "tmdb_id" SET DATA TYPE bigint;