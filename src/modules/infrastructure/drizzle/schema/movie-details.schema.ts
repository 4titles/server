import { relations } from 'drizzle-orm'
import { date, integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { titles } from './titles.schema'

export const movieDetails = pgTable('movie_details', {
    titleId: uuid('title_id')
        .unique()
        .references(() => titles.id, { onDelete: 'cascade' })
        .notNull(),
    budget: integer('budget').default(0),
    revenue: integer('revenue').default(0),
    runtime: integer('runtime').default(0),
    releaseDate: date('release_date'),
})

export const movieDetailsRelations = relations(movieDetails, ({ one }) => ({
    title: one(titles, {
        fields: [movieDetails.titleId],
        references: [titles.id],
    }),
}))

export type DbMovieDetails = typeof movieDetails.$inferSelect
export type DbMovieDeatilsInsert = typeof movieDetails.$inferInsert
