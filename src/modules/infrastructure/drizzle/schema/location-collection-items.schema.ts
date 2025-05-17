import { relations } from 'drizzle-orm'
import { integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { collections } from './collections.schema'
import { filmingLocations } from './filming-locations.schema'

export const locationCollectionItems = pgTable(
    'location_collection_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        collectionId: uuid('collection_id')
            .notNull()
            .references(() => collections.id, { onDelete: 'cascade' }),
        locationId: uuid('location_id')
            .notNull()
            .references(() => filmingLocations.id, { onDelete: 'cascade' }),
        position: integer('position'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueCollectionLocation: unique('unique_location_collection').on(
            table.collectionId,
            table.locationId,
        ),
    }),
)

export const locationCollectionItemsRelations = relations(
    locationCollectionItems,
    ({ one }) => ({
        collection: one(collections, {
            fields: [locationCollectionItems.collectionId],
            references: [collections.id],
        }),
        location: one(filmingLocations, {
            fields: [locationCollectionItems.locationId],
            references: [filmingLocations.id],
        }),
    }),
)

export type DbLocationCollectionItem =
    typeof locationCollectionItems.$inferSelect
export type DbLocationCollectionItemInsert =
    typeof locationCollectionItems.$inferInsert
