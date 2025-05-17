import { collectionTypeEnum } from '@/modules/infrastructure/drizzle/schema/enums.schema'
import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    pgTable,
    text,
    unique,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { comments } from './comments.schema'
import { favorites } from './favorites.schema'
import { locationCollectionItems } from './location-collection-items.schema'
import { titleCollectionItems } from './title-collection-items.schema'
import { users } from './users.schema'

export const collections = pgTable(
    'collections',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        title: varchar('title', { length: 255 }).notNull(),
        slug: text('slug').unique().notNull(),
        description: text('description'),
        coverImage: varchar('cover_image', { length: 255 }),
        isPrivate: boolean('is_private').default(false).notNull(),
        type: collectionTypeEnum('type').notNull(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        ...timestamps,
    },
    (table) => ({
        slugIdx: index('collections_slug_idx').on(table.slug),
        titleIdx: index('collections_title_idx').on(table.title),
        uniqueCollection: unique().on(table.userId, table.title, table.slug),
    }),
)

export const collectionsRelations = relations(collections, ({ one, many }) => ({
    user: one(users, {
        fields: [collections.userId],
        references: [users.id],
    }),
    favorites: many(favorites),
    comments: many(comments),
    titleItems: many(titleCollectionItems),
    locationItems: many(locationCollectionItems),
}))

export type DbCollection = typeof collections.$inferSelect
export type DbCollectionInsert = typeof collections.$inferInsert
