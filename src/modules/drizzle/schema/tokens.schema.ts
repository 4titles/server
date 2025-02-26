import { TokenType } from '@/modules/auth/account/enums/token-type.enum'
import {
    index,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const tokenTypeEnum = pgEnum('token_type_enum', [
    TokenType.EMAIL_VERIFY,
    TokenType.PASSWORD_RESET,
    TokenType.DEACTIVATE_ACCOUNT,
] as const)

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
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            tokenIdx: index('token_idx').on(table.token),
            userTypeIdx: index('user_type_idx').on(table.userId, table.type),
            expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
            userIdIdx: index('user_id_idx').on(table.userId),
        }
    },
)

export type DbToken = typeof tokens.$inferSelect
