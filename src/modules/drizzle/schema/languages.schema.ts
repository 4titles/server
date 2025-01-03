import { bigint, index, pgTable, unique, varchar } from 'drizzle-orm/pg-core'

export const languages = pgTable(
    'languages',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        name: varchar('name').default(''),
    },
    (table) => ({
        iso: unique('iso_unique_idx'),
        englishNameIndex: index('english_name_index').on(table.englishName),
        nameIndex: index('name_index').on(table.name),
    }),
)

// export const movieLanguages = pgTable(
//     'movie_genres',
//     {
//         movieId: bigint('movie_id', { mode: 'bigint' })
//             .notNull()
//             .references(() => movies.id),
//         genreId: bigint('genre_id', { mode: 'bigint' })
//             .notNull()
//             .references(() => genres.id),
//     },
//     (table) => ({
//         pk: index('movie_genres_pkey').on(table.movieId, table.genreId),
//         movieIdIdx: index('movie_genres_movie_id_idx').on(table.movieId),
//         genreIdIdx: index('movie_genres_genre_id_idx').on(table.genreId),
//     }),
// )

export type DbLanguage = typeof languages.$inferSelect
