import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { tokenTypeEnum } from './enums.schema'
import { users } from './users.schema'

export const tokens = pgTable(
    'tokens',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        token: text('token').unique(),
        type: tokenTypeEnum('type').notNull(),
        userId: uuid('user_id').references(() => users.id, {
            onDelete: 'cascade',
        }),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        ...timestamps,
    },
    (table) => {
        return {
            tokenIdx: index('token_idx').on(table.token),
            userTypeIdx: index('user_type_idx').on(table.userId, table.type),
            expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
        }
    },
)

export const tokensRelations = relations(tokens, ({ one }) => ({
    user: one(users, {
        fields: [tokens.userId],
        references: [users.id],
    }),
}))

export type DbToken = typeof tokens.$inferSelect
