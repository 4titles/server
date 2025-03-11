import { generateToken } from '@/shared/utils/generate-token.util'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { and, count, desc, eq } from 'drizzle-orm'
import { TokenType } from '../auth/account/enums/token-type.enum'
import { User } from '../auth/account/models/user.model'
import { DRIZZLE } from '../drizzle/drizzle.module'
import {
    DbNotification,
    notifications,
    notificationSettings,
} from '../drizzle/schema/notifications.schema'
import { DbUser, users } from '../drizzle/schema/users.schema'
import { DrizzleDB } from '../drizzle/types/drizzle'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationType } from './enums/notification-type.enum'
import { ChangeNotificationSettingsInput } from './inputs/change-notification-settings.input'

@Injectable()
export class NotificationService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,
    ) {}

    async findUnreadCount(user: User): Promise<number> {
        const unreadUserNotificationsCount = await this.db
            .select({ count: count() })
            .from(notifications)
            .where(eq(notifications.userId, user.id))

        const unreadGlobalNotificationsCount = await this.db
            .select({ count: count() })
            .from(notifications)
            .where(
                and(
                    eq(notifications.isGlobal, true),
                    eq(notifications.isRead, false),
                ),
            )

        return (
            (unreadUserNotificationsCount[0]?.count || 0) +
            (unreadGlobalNotificationsCount[0]?.count || 0)
        )
    }

    async findByUser(user: User): Promise<DbNotification[]> {
        await this.db
            .update(notifications)
            .set({ isRead: true } as Partial<DbNotification>)
            .where(
                and(
                    eq(notifications.userId, user.id),
                    eq(notifications.isRead, false),
                ),
            )

        const userNotifications = await this.db.query.notifications.findMany({
            where: eq(notifications.userId, user.id),
            orderBy: desc(notifications.createdAt),
        })

        const globalNotifications = await this.db.query.notifications.findMany({
            where: eq(notifications.isGlobal, true),
            orderBy: desc(notifications.createdAt),
        })

        return [...userNotifications, ...globalNotifications].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        )
    }

    async createNewFollowingUserNotification(userId: string, follower: User) {
        const newNotification = {
            message: `<b className='font-bold'>Пользователь <a href='${follower.username}
            className='font-semibold'>${follower.displayName}</a> подписался на Ваши обновления.</b>`,
            type: NotificationType.NEW_FOLLOWER,
            userId,
        }

        const [createdNotification] = await this.db
            .insert(notifications)
            .values(newNotification)
            .returning()

        return createdNotification
    }

    async createGlobalNotification(message: string) {
        const newNotification = {
            message,
            type: NotificationType.INFO,
            isGlobal: true,
            userId: null,
        }

        const [createdNotification] = await this.db
            .insert(notifications)
            .values(newNotification)
            .returning()

        const usersWithTelegram =
            await this.db.query.notificationSettings.findMany({
                where: eq(
                    notificationSettings.isTelegramNotificationsEnabled,
                    true,
                ),
                with: { user: true },
            })

        const eligibleUsers = usersWithTelegram.filter(
            (setting) =>
                setting.user.telegramId !== null &&
                setting.user.telegramId !== undefined,
        )

        for (const userSetting of eligibleUsers) {
            try {
                await this.telegramService.sendInfoNotification(
                    userSetting.user.telegramId,
                    message,
                )
            } catch (error) {
                console.error(
                    `Failed to send Telegram notification to user ${userSetting.userId}:`,
                    error,
                )
            }
        }

        return createdNotification
    }

    async changeSettings(user: User, input: ChangeNotificationSettingsInput) {
        const { isSiteNotificationsEnabled, isTelegramNotificationsEnabled } =
            input

        const notificationSettingsUpdate = {
            userId: user.id,
            isSiteNotificationsEnabled,
            isTelegramNotificationsEnabled,
        }

        const existingNotificationSettings =
            await this.db.query.notificationSettings.findFirst({
                where: eq(notificationSettings.userId, user.id),
                with: { user: true },
            })

        if (!existingNotificationSettings) {
            await this.db
                .insert(notificationSettings)
                .values(notificationSettingsUpdate)
                .returning()
        } else {
            await this.db
                .update(notificationSettings)
                .set(notificationSettingsUpdate)
                .where(eq(notificationSettings.userId, user.id))
        }

        const updatedNotificationSettings =
            await this.db.query.notificationSettings.findFirst({
                where: eq(notificationSettings.userId, user.id),
                with: { user: true },
            })

        if (
            updatedNotificationSettings.isTelegramNotificationsEnabled &&
            !updatedNotificationSettings.user.telegramId
        ) {
            const telegramAuthToken = await generateToken(
                this.db,
                user,
                TokenType.TELEGRAM_AUTH,
            )

            return {
                notificationSettings: updatedNotificationSettings,
                telegramAuthToken: telegramAuthToken.token,
            }
        }

        if (
            !updatedNotificationSettings.isTelegramNotificationsEnabled &&
            updatedNotificationSettings.user.telegramId
        ) {
            await this.db
                .update(users)
                .set({ telegramId: null } as Partial<DbUser>)
                .where(eq(users.id, user.id))
        }

        return {
            notificationSettings: updatedNotificationSettings,
        }
    }
}
