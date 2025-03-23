import { relations } from 'drizzle-orm'
import { index, pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { filmingLocations } from './filming-locations.schema'
import { titles } from './titles.schema'

export const titleFilmingLocations = pgTable(
    'title_filming_locations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        filmingLocationId: uuid('filming_location_id')
            .references(() => filmingLocations.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        uniqueTitleLocation: unique().on(
            table.titleId,
            table.filmingLocationId,
        ),
        titleIdIdx: index('title_filming_locations_title_id_idx').on(
            table.titleId,
        ),
        filmingLocationIdIdx: index(
            'title_filming_locations_filming_location_id_idx',
        ).on(table.filmingLocationId),
    }),
)

export const titleFilmingLocationsRelations = relations(
    titleFilmingLocations,
    ({ one }) => ({
        title: one(titles, {
            fields: [titleFilmingLocations.titleId],
            references: [titles.id],
        }),
        filmingLocation: one(filmingLocations, {
            fields: [titleFilmingLocations.filmingLocationId],
            references: [filmingLocations.id],
        }),
    }),
)

export type DbTitleFilmingLocations = typeof titleFilmingLocations.$inferSelect
export type DbTitleFilmingLocationsInsert =
    typeof titleFilmingLocations.$inferInsert
