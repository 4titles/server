import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { feedbacks } from './feedbacks.schema'
import { follows } from './follows.schema'
import { notifications, notificationSettings } from './notifications.schema'
import { userRoles } from './roles-permissions.schema'
import { socialLinks } from './social-links.schema'
import { tokens } from './tokens.schema'

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: text('email').unique().notNull(),
        password: text('password').notNull(),
        username: text('username').unique().notNull(),
        displayName: text('display_name'),
        avatar: text('avatar'),
        bio: text('bio'),
        telegramId: text('telegram_id').unique(),
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
        ...timestamps,
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

export const usersRelations = relations(users, ({ many, one }) => ({
    tokens: many(tokens),
    socialLinks: many(socialLinks),
    notifications: many(notifications),
    feedbacks: many(feedbacks),
    notificationSettings: one(notificationSettings, {
        fields: [users.id],
        references: [notificationSettings.userId],
    }),
    followings: many(follows, { relationName: 'follower' }),
    followers: many(follows, { relationName: 'following' }),
    roles: many(userRoles),
}))

export type DbUser = typeof users.$inferSelect
