import { relations } from 'drizzle-orm'
import { index, pgTable, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { titleFilmingLocations } from './title-filming-locations.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const favorites = pgTable(
    'favorites',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        titleId: uuid('title_id').references(() => titles.id, {
            onDelete: 'cascade',
        }),
        locationId: uuid('location_id').references(
            () => titleFilmingLocations.id,
            {
                onDelete: 'cascade',
            },
        ),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('favorites_user_id_idx').on(table.userId),
        titleIdIdx: index('favorites_title_id_idx').on(table.titleId),
        locationIdIdx: index('favorites_location_id_idx').on(table.locationId),
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
    }),
    location: one(titleFilmingLocations, {
        fields: [favorites.locationId],
        references: [titleFilmingLocations.id],
    }),
}))
