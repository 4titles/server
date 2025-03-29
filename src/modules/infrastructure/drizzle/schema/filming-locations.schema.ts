import { relations } from 'drizzle-orm'
import { index, pgTable, point, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { countries } from './countries.schema'
import { titleFilmingLocations } from './title-filming-locations.schema'
import { users } from './users.schema'

export const filmingLocations = pgTable(
    'filming_locations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        address: text('address').notNull(),
        coordinates: point('coordinates', { mode: 'xy' }).notNull(),
        formattedAddress: text('formatted_address'),
        placeId: text('place_id').unique(),
        countryId: uuid('country_id')
            .references(() => countries.id, {
                onDelete: 'set null',
            })
            .notNull(),
        city: text('city'),
        state: text('state'),
        description: text('description'),
        enhancedDescription: text('enhanced_description'),
        userId: uuid('user_id').references(() => users.id, {
            onDelete: 'set null',
        }),
        ...timestamps,
    },
    (table) => ({
        addressIdx: index('filming_locations_address_idx').on(table.address),
    }),
)

export const filmingLocationsRelations = relations(
    filmingLocations,
    ({ one, many }) => ({
        titleFilmingLocations: many(titleFilmingLocations),
        country: one(countries, {
            fields: [filmingLocations.countryId],
            references: [countries.id],
        }),
        user: one(users, {
            fields: [filmingLocations.userId],
            references: [users.id],
        }),
    }),
)

export type DbFilmingLocation = typeof filmingLocations.$inferSelect
export type DbFilmingLocationInsert = typeof filmingLocations.$inferInsert
