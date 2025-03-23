import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { titleGenres } from './title-genres.schema'

export const genres = pgTable(
    'genres',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tmdbId: text('tmdb_id').notNull().unique(),
        name: text('name').unique(),
        englishName: text('english_name').unique(),
    },
    (table) => ({
        tmdbIdIdx: index('genres_tmdb_id_idx').on(table.tmdbId),
        nameIndex: index('genres_native_name_idx').on(table.name),
        englishNameIndex: index('genres_english_name_idx').on(
            table.englishName,
        ),
    }),
)

export const genresRelations = relations(genres, ({ many }) => ({
    titles: many(titleGenres),
}))

export type DbGenre = typeof genres.$inferSelect
export type DbGenreInsert = typeof genres.$inferInsert
