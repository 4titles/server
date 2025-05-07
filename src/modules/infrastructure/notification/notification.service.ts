import { FilmingLocationProposalStatus } from '@/modules/content/title/modules/filming-location/modules/filming-location-proposal/enums/filming-location-proposal-status.enum'
import { FilmingLocationProposal } from '@/modules/content/title/modules/filming-location/modules/filming-location-proposal/models/filming-location-proposal.model'
import { generateToken } from '@/shared/utils/common/generate-token.util'
import {
    ConflictException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common'
import { and, count, desc, eq, lte, or } from 'drizzle-orm'
import { TokenType } from '../../auth/account/enums/token-type.enum'
import { User } from '../../auth/account/models/user.model'
import { Feedback } from '../../content/feedback/models/feedback.model'
import { DRIZZLE } from '../drizzle/drizzle.module'
import {
    DbNotification,
    notifications,
    notificationSettings,
} from '../drizzle/schema/notifications.schema'
import { DbUser, users } from '../drizzle/schema/users.schema'
import { DrizzleDB } from '../drizzle/types/drizzle'
import { TelegramService } from '../telegram/telegram.service'
import { NotificationType } from './enums/notification-type.enum'
import { ChangeNotificationSettingsInput } from './inputs/change-notification-settings.input'

@Injectable()
export class NotificationService {
    private readonly logger: Logger = new Logger(NotificationService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,
    ) {}

    async findUnreadCount(user: User): Promise<number> {
        const unreadUserNotificationsCount = await this.db
            .select({ count: count() })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, user.id),
                    eq(notifications.isRead, false),
                ),
            )

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
                or(
                    and(
                        eq(notifications.userId, user.id),
                        eq(notifications.isRead, false),
                    ),
                    and(
                        eq(notifications.isGlobal, true),
                        eq(notifications.isRead, false),
                    ),
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

        await this.createNotificationSettingsForUserIfNotExists(user)

        await this.db
            .update(notificationSettings)
            .set(notificationSettingsUpdate)
            .where(eq(notificationSettings.userId, user.id))

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

    async createNotificationSettingsForUserIfNotExists(
        user: User,
    ): Promise<void> {
        const existingNotificationSettings =
            await this.db.query.notificationSettings.findFirst({
                where: eq(notificationSettings.userId, user.id),
                with: { user: true },
            })

        if (!existingNotificationSettings) {
            await this.db
                .insert(notificationSettings)
                .values({
                    userId: user.id,
                })
                .returning()
        }
    }

    async notifyUserAboutFeedbackResponse(
        telegramId: string,
        feedback: Feedback,
        userId?: string,
    ): Promise<void> {
        try {
            const message = `<b>✅ Ответ на ваш отзыв</b>\n\n<i>Ваш отзыв:</i>\n${feedback.message}\n\n<b>Ответ от команды:</b>\n${feedback.responseMessage}`
            const notifiableUserId = userId ?? feedback?.user?.id

            if (notifiableUserId) {
                const newNotification = {
                    message,
                    type: NotificationType.INFO,
                    userId: userId ?? feedback.user.id,
                }

                await this.db.insert(notifications).values(newNotification)
            }

            if (telegramId && feedback?.responseMessage) {
                await this.telegramService.sendInfoNotification(
                    telegramId,
                    message,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to notify user about feedback response: ${error.message}`,
                error.stack,
            )
        }
    }

    async notifyProposalStatusUpdate(
        proposal: FilmingLocationProposal,
    ): Promise<void> {
        try {
            const {
                status,
                title,
                reviewMessage,
                address,
                user,
                description,
                createdAt,
            } = proposal
            if (!title || !user) {
                throw new ConflictException(
                    'Not enough data provided for filming location proposal status update notification',
                )
            }

            const statusLabels = {
                [FilmingLocationProposalStatus.IN_PROGRESS]:
                    'В процессе обработки',
                [FilmingLocationProposalStatus.PENDING]: 'На рассмотрении',
                [FilmingLocationProposalStatus.APPROVED]: 'Одобрена',
                [FilmingLocationProposalStatus.REJECTED]: 'Отклонена',
            }

            const statusLabel = statusLabels[status] || status

            let message =
                `<b>Статус заявки на локацию съемок обновлен</b>\n\n` +
                `🎬 <b>Тайтл:</b> ${title.originalName}\n` +
                `📅 <b>Дата подачи:</b> ${new Date(createdAt).toLocaleDateString()}\n` +
                `🔄 <b>Новый статус:</b> ${statusLabel}\n`

            if (description) {
                message += `\n📝 <b>Описание локации:</b>\n${description}\n`
            }
            if (address) {
                message += `\n📍 <b>Адрес:</b> ${address}\n`
            }
            if (reviewMessage) {
                message += `\n💬 <b>Комментарий модератора:</b>\n${reviewMessage}\n`
            }

            message += `\nСпасибо за ваш вклад в развитие базы локаций!`

            const newNotification = {
                message,
                type: NotificationType.FILMING_LOCATION_PROPOSAL_STATUS_UPDATE,
                userId: user.id,
            }

            await this.db.insert(notifications).values(newNotification)

            await this.sendTelegramNotificationIfEnabled(user.id, message)
        } catch (error) {
            this.logger.error(
                `Failed to notify user about proposal status update: ${error.message}`,
                error.stack,
            )
        }
    }

    private async sendTelegramNotificationIfEnabled(
        userId: string,
        message: string,
    ): Promise<void> {
        try {
            const userSettings =
                await this.db.query.notificationSettings.findFirst({
                    where: eq(notificationSettings.userId, userId),
                    with: { user: true },
                })

            if (
                userSettings?.isTelegramNotificationsEnabled &&
                userSettings?.user?.telegramId
            ) {
                await this.telegramService.sendInfoNotification(
                    userSettings.user.telegramId,
                    message,
                )
            }
        } catch (error) {
            this.logger.warn(
                `Failed to send Telegram notification to user ${userId}: ${error.message}`,
            )
        }
    }

    async notifyAdminsAboutBugReport(
        feedback: Feedback,
        user?: User,
    ): Promise<void> {
        this.logger.warn(
            `Critical bug report received from user <b>${user ? user.username : 'unknown'}</b>: "${feedback.message}"`,
            `${NotificationService.name}.${this.notifyAdminsAboutBugReport.name}`,
        )
    }

    async deleteOld(): Promise<void> {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        await this.db
            .delete(notifications)
            .where(lte(notifications.createdAt, sevenDaysAgo))
    }
}
