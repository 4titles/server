import { relations } from 'drizzle-orm'
import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { locations } from './locations.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const titleFilmingLocations = pgTable(
    'title_filming_locations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        locationId: uuid('location_id')
            .references(() => locations.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        userId: uuid('user_id')
            .references(() => users.id, {
                onDelete: 'set null',
            })
            .notNull(),
        description: text('description'),
        ...timestamps,
    },
    (table) => ({
        uniqueTitleLocation: unique().on(table.titleId, table.locationId),
        titleIdIdx: index('title_filming_locations_title_id_idx').on(
            table.titleId,
        ),
        locationIdIdx: index('title_filming_locations_location_id_idx').on(
            table.locationId,
        ),
        userIdIdx: index('title_filming_locations_user_id_idx').on(
            table.userId,
        ),
    }),
)

export const titleFilmingLocationsRelations = relations(
    titleFilmingLocations,
    ({ one }) => ({
        location: one(locations, {
            fields: [titleFilmingLocations.locationId],
            references: [locations.id],
        }),
        user: one(users, {
            fields: [titleFilmingLocations.userId],
            references: [users.id],
        }),
        title: one(titles, {
            fields: [titleFilmingLocations.titleId],
            references: [titles.id],
        }),
    }),
)

export type DbTitleFilmingLocations = typeof titleFilmingLocations.$inferSelect
export type DbTitleFilmingLocationsInsert =
    typeof titleFilmingLocations.$inferInsert
