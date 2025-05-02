import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { notificationTypeEnum } from './enums.schema'
import { users } from './users.schema'

export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        message: text('message').notNull(),
        type: notificationTypeEnum('type').notNull(),
        isRead: boolean('is_read').default(false),
        isGlobal: boolean('is_global').default(false),
        userId: uuid('user_id').references(() => users.id, {
            onDelete: 'cascade',
        }),
        ...timestamps,
    },
    (table) => {
        return {
            userIdIdx: index('notifications_user_id_idx').on(table.userId),
            typeIdx: index('notifications_type_idx').on(table.type),
            isReadIdx: index('notifications_is_read_idx').on(table.isRead),
            isGlobalIdx: index('notifications_is_global_idx').on(
                table.isGlobal,
            ),
        }
    },
)

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
    ).default(false),
    ...timestamps,
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
