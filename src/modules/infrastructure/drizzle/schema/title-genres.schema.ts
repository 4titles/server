import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { genres } from './genres.schema'
import { titles } from './titles.schema'

export const titleGenres = pgTable(
    'title_genres',
    {
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        genreId: uuid('genre_id')
            .references(() => genres.id, {
                onDelete: 'cascade',
            })
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.titleId, table.genreId] }),
    }),
)

export const titleGenresRelations = relations(titleGenres, ({ one }) => ({
    title: one(titles, {
        fields: [titleGenres.titleId],
        references: [titles.id],
    }),
    genre: one(genres, {
        fields: [titleGenres.genreId],
        references: [genres.id],
    }),
}))

export type DbTitleGenre = typeof titleGenres.$inferSelect
export type DbTitleGenreInsert = typeof titleGenres.$inferInsert
