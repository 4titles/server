import { GenreTranslations } from '@/modules/content/titles/models/title-genre.model'
import { relations } from 'drizzle-orm'
import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { titleGenres } from './title-genres.schema'

export const genres = pgTable(
    'genres',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tmdbId: text('tmdb_id').notNull().unique(),
        names: jsonb('names').$type<GenreTranslations>().notNull(),
    },
    (table) => ({
        tmdbIdIdx: index('genres_tmdb_id_idx').on(table.tmdbId),
    }),
)

export const genresRelations = relations(genres, ({ many }) => ({
    titles: many(titleGenres),
}))

export type DbGenre = typeof genres.$inferSelect
export type DbGenreInsert = typeof genres.$inferInsert
