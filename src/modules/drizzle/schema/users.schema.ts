import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: text('email').unique().notNull(),
        password: text('password').notNull(),
        username: text('username').notNull(),
        displayName: text('display_name'),
        avatar: text('avatar'),
        bio: text('bio'),
        isVerified: boolean('is_verified').default(false),
        isTotpEnabled: boolean('is_totp_enabled').default(false),
        totpSecret: text('totp_secret'),
        isDeactivated: boolean('is_deactived').default(false),
        deactivatedAt: timestamp('deactivated_at', {
            withTimezone: true,
        }).default(null),
        emailVerifiedAt: timestamp('email_verified_at', {
            withTimezone: true,
        }).default(null),
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
