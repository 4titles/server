import { SimplePerson } from '@/modules/content/titles/models/common.model'
import { relations } from 'drizzle-orm'
import {
    boolean,
    date,
    integer,
    jsonb,
    pgTable,
    uuid,
} from 'drizzle-orm/pg-core'
import { titles } from './titles.schema'

export const seriesDetails = pgTable('series_details', {
    titleId: uuid('title_id')
        .unique()
        .references(() => titles.id, { onDelete: 'cascade' }),
    createdBy: jsonb('created_by').$type<SimplePerson[]>().default([]),
    episodeRunTime: jsonb('episode_run_time').$type<number[]>().default([]),
    inProduction: boolean('in_production').notNull().default(false),
    firstAirDate: date('first_air_date'),
    lastAirDate: date('last_air_date'),
    numberOfEpisodes: integer('number_of_episodes').default(0),
    numberOfSeasons: integer('number_of_seasons').default(0),
})

export const seriesDetailsRelations = relations(seriesDetails, ({ one }) => ({
    title: one(titles, {
        fields: [seriesDetails.titleId],
        references: [titles.id],
    }),
}))

export type DbSeriesDetails = typeof seriesDetails.$inferSelect
export type DbSeriesDetailsInsert = typeof seriesDetails.$inferInsert
