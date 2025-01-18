import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: text('email').unique().notNull(),
        password: text('password').notNull(),
        username: text('username').notNull(),
        displayName: text('display_name'),
        avatar: text('avatar'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            emailIdx: index('email_idx').on(table.email),
            emailPasswordIdx: index('email_password_idx').on(
                table.email,
                table.password,
            ),
        }
    },
)

export type DbUser = typeof users.$inferSelect
