import { NotificationType } from '@/modules/notification/enums/notification-type.enum'
import { relations } from 'drizzle-orm'
import {
    boolean,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const notificationTypeEnum = pgEnum('notification_type_enum', [
    NotificationType.ENABLE_TWO_FACTOR,
    NotificationType.NEW_FOLLOWER,
    NotificationType.NEW_FAVORITE_TITLE_LOCATION,
    NotificationType.INFO,
] as const)

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    message: text('message').notNull(),
    type: notificationTypeEnum('type').notNull(),
    isRead: boolean('is_read').default(false),
    isGlobal: boolean('is_global').default(false),
    userId: uuid('user_id').references(() => users.id, {
        onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const notificationSettings = pgTable('notification_settings', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' })
        .unique(),
    isSiteNotificationsEnabled: boolean(
        'is_site_notifications_enabled',
    ).default(true),
    isTelegramNotificationsEnabled: boolean(
        'is_telegram_notifications_enabled',
    ).default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}))

export const notificationSettingsRelations = relations(
    notificationSettings,
    ({ one }) => ({
        user: one(users, {
            fields: [notificationSettings.userId],
            references: [users.id],
        }),
    }),
)

export type DbNotification = typeof notifications.$inferSelect
export type DbNotificationSettings = typeof notificationSettings.$inferSelect
