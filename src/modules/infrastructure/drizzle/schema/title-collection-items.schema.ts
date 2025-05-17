import { relations } from 'drizzle-orm'
import { integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { collections } from './collections.schema'
import { titles } from './titles.schema'

export const titleCollectionItems = pgTable(
    'title_collection_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        collectionId: uuid('collection_id')
            .notNull()
            .references(() => collections.id, { onDelete: 'cascade' }),
        titleId: uuid('title_id')
            .notNull()
            .references(() => titles.id, { onDelete: 'cascade' }),
        position: integer('position'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        uniqueCollectionTitle: unique('unique_collection_title').on(
            table.collectionId,
            table.titleId,
        ),
    }),
)

export const titleCollectionItemsRelations = relations(
    titleCollectionItems,
    ({ one }) => ({
        collection: one(collections, {
            fields: [titleCollectionItems.collectionId],
            references: [collections.id],
        }),
        title: one(titles, {
            fields: [titleCollectionItems.titleId],
            references: [titles.id],
        }),
    }),
)

export type DbTitleCollectionItem = typeof titleCollectionItems.$inferSelect
export type DbTitleCollectionItemInsert =
    typeof titleCollectionItems.$inferInsert
