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
import { favorites } from './favorites.schema'
import { feedbacks } from './feedbacks.schema'
import { filmingLocations } from './filming-locations.schema'
import { follows } from './follows.schema'
import { notifications, notificationSettings } from './notifications.schema'
import { userRoles } from './roles-permissions.schema'
import { socialLinks } from './social-links.schema'
import { titleComments } from './title-comments.schema'
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
        isDeactivated: boolean('is_deactivated').default(false),
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
            usernameIdx: index('username_idx').on(table.username),
            telegramIdIdx: index('telegram_id_idx').on(table.telegramId),
            isVerifiedIdx: index('is_verified_idx').on(table.isVerified),
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
    addedFilmingLocations: many(filmingLocations),
    comments: many(titleComments),
    favorites: many(favorites),
}))

export type DbUser = typeof users.$inferSelect
export type DbUserInsert = typeof users.$inferInsert
