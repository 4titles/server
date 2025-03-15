import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { users } from './users.schema'

export const socialLinks = pgTable(
    'social_links',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        title: text('title'),
        url: text('url'),
        position: integer('position'),
        ...timestamps,
    },
    (table) => {
        return {
            userIdIdx: index('social_links_user_id_idx').on(table.userId),
            positionIdx: index('social_links_position_idx').on(table.position),
        }
    },
)

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
    user: one(users, {
        fields: [socialLinks.userId],
        references: [users.id],
    }),
}))

export type DbSocialLink = typeof socialLinks.$inferSelect
