import { relations } from 'drizzle-orm'
import { index, pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { collections } from './collections.schema'
import { favorableTypeEnum } from './enums.schema'
import { filmingLocations } from './filming-locations.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const favorites = pgTable(
    'favorites',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        favorableType: favorableTypeEnum('favorable_type').notNull(),
        favorableId: uuid('favorable_id').notNull(),
        contextId: uuid('context_id'),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('favorites_user_id_idx').on(table.userId),
        favorableTypeIdx: index('favorites_favorable_type_idx').on(
            table.favorableType,
        ),
        favorableIdIdx: index('favorites_favorable_id_idx').on(
            table.favorableId,
        ),
        contextIdIdx: index('favorites_context_id_idx').on(table.contextId),
        uniqueFavorite: unique('favorites_user_favorable_context_unique').on(
            table.userId,
            table.favorableType,
            table.favorableId,
            table.contextId,
        ),
    }),
)

export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, {
        fields: [favorites.userId],
        references: [users.id],
    }),
    title: one(titles, {
        fields: [favorites.favorableId],
        references: [titles.id],
        relationName: 'title',
    }),
    filmingLocation: one(filmingLocations, {
        fields: [favorites.favorableId],
        references: [filmingLocations.id],
    }),
    contextTitle: one(titles, {
        fields: [favorites.contextId],
        references: [titles.id],
        relationName: 'contextTitle',
    }),
    collection: one(collections, {
        fields: [favorites.favorableId],
        references: [collections.id],
    }),
}))

export type DbFavoriteSelect = typeof favorites.$inferSelect
export type DbFavoriteInsert = typeof favorites.$inferInsert
