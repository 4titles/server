import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const socialLinks = pgTable('social_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    title: text('title'),
    url: text('url'),
    position: integer('position'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
    user: one(users, {
        fields: [socialLinks.userId],
        references: [users.id],
    }),
}))

export type DbSocialLink = typeof socialLinks.$inferSelect
