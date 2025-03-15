import { relations } from 'drizzle-orm'
import { index, pgTable, point, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { titleFilmingLocations } from './title-filming-locations.schema'

export const locations = pgTable(
    'locations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        address: text('address').notNull(),
        coordinates: point('coordinates', { mode: 'xy' }),
        formattedAddress: text('formatted_address'),
        ...timestamps,
    },
    (table) => ({
        addressIdx: index('locations_address_idx').on(table.address),
    }),
)

export const locationsRelations = relations(locations, ({ many }) => ({
    filmingLocations: many(titleFilmingLocations),
}))

export type DbLocation = typeof locations.$inferSelect
export type DbLocationInsert = typeof locations.$inferInsert
