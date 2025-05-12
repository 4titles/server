import { relations } from 'drizzle-orm'
import { index, pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { favoriteTypeEnum } from './enums.schema'
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
        type: favoriteTypeEnum('type').notNull(),
        titleId: uuid('title_id').references(() => titles.id, {
            onDelete: 'cascade',
        }),
        filmingLocationId: uuid('filming_location_id').references(
            () => filmingLocations.id,
            {
                onDelete: 'cascade',
            },
        ),
        filmingLocationTitleId: uuid('filming_location_title_id').references(
            () => titles.id,
            {
                onDelete: 'cascade',
            },
        ),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('favorites_user_id_idx').on(table.userId),
        typeIdx: index('favorites_type_idx').on(table.type),
        titleIdIdx: index('favorites_title_id_idx').on(table.titleId),
        filmingLocationIdIdx: index('favorites_filming_location_id_idx').on(
            table.filmingLocationId,
        ),
        uniqueFavorite: unique('favorites_user_type_entity_unique').on(
            table.userId,
            table.type,
            table.titleId,
            table.filmingLocationId,
        ),
    }),
)

export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, {
        fields: [favorites.userId],
        references: [users.id],
    }),
    title: one(titles, {
        fields: [favorites.titleId],
        references: [titles.id],
        relationName: 'title',
    }),
    filmingLocation: one(filmingLocations, {
        fields: [favorites.filmingLocationId],
        references: [filmingLocations.id],
    }),
    filmingLocationTitle: one(titles, {
        fields: [favorites.filmingLocationTitleId],
        references: [titles.id],
        relationName: 'filmingLocationTitle',
    }),
}))

export type DbFavoriteSelect = typeof favorites.$inferSelect
export type DbFavoriteInsert = typeof favorites.$inferInsert
