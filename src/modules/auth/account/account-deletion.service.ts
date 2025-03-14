import { DatabaseException } from '@/modules/content/titles/exceptions/database.exception'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbUser,
    users,
} from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { MailService } from '@/modules/infrastructure/mail/mail.service'
import { S3Service } from '@/modules/infrastructure/s3/s3.service'
import { TelegramService } from '@/modules/infrastructure/telegram/telegram.service'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq, lte } from 'drizzle-orm'
import { User } from './models/user.model'

@Injectable()
export class AccountDeletionService {
    private readonly logger = new Logger(AccountDeletionService.name)
    private DAYS_THRESHOLD: number = 7

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly mailService: MailService,
        private readonly telegramService: TelegramService,
        private readonly s3Service: S3Service,
    ) {}

    async findDeactivatedAccounts(
        daysThreshold: number = this.DAYS_THRESHOLD,
    ): Promise<DbUser[]> {
        try {
            const thresholdDate = this.calculateThresholdDate(daysThreshold)

            return await this.db.query.users.findMany({
                where: (users, { and, eq, lte }) =>
                    and(
                        eq(users.isDeactivated, true),
                        lte(users.deactivatedAt, thresholdDate),
                    ),
                with: { notificationSettings: true },
            })
        } catch (error) {
            this.logger.error(
                `Failed to find deactivated accounts: ${error.message}`,
                error.stack,
            )
            throw new DatabaseException(error)
        }
    }

    async notifyUsersAboutDeletion(deactivatedAccounts: User[]): Promise<void> {
        try {
            const notificationPromises = deactivatedAccounts.map((user) => {
                const promises = []

                promises.push(
                    this.mailService
                        .sendAccountDeletion(user.email)
                        .catch((error) => {
                            this.logger.warn(
                                `Failed to send deletion email to ${user.email}: ${error.message}`,
                            )
                            return null
                        }),
                )

                if (
                    user.notificationSettings.isTelegramNotificationsEnabled &&
                    user.telegramId
                ) {
                    promises.push(
                        this.telegramService
                            .sendAccountDeletion(user.telegramId)
                            .catch((error) => {
                                this.logger.warn(
                                    `Failed to send Telegram deletion notification to user ${user.id}: ${error.message}`,
                                )
                                return null
                            }),
                    )
                }

                return Promise.all(promises)
            })

            await Promise.all(notificationPromises)
        } catch (error) {
            this.logger.error(
                `Failed to notify users about deletion: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async deleteAccounts(
        daysThreshold: number = this.DAYS_THRESHOLD,
    ): Promise<number> {
        try {
            const thresholdDate = this.calculateThresholdDate(daysThreshold)

            const result = await this.db
                .delete(users)
                .where(
                    and(
                        eq(users.isDeactivated, true),
                        lte(users.deactivatedAt, thresholdDate),
                    ),
                )
                .returning({ id: users.id })

            return result.length
        } catch (error) {
            this.logger.error(
                `Failed to delete deactivated accounts: ${error.message}`,
                error.stack,
            )
            throw new DatabaseException(error)
        }
    }

    async deleteAccountDataFromStorage(user: User): Promise<void> {
        if (user.avatar) {
            try {
                await this.s3Service.remove(user.avatar)
                this.logger.log(
                    `Deleted storage data (avatar) for user ${user.id}`,
                )
            } catch (error) {
                this.logger.warn(
                    `Failed to delete storage data for user ${user.id}: ${error.message}`,
                )
            }
        }
    }

    async processAccountDeletion(
        daysThreshold: number = this.DAYS_THRESHOLD,
    ): Promise<{
        notifiedCount: number
        deletedCount: number
    }> {
        try {
            const deactivatedAccounts =
                await this.findDeactivatedAccounts(daysThreshold)

            if (deactivatedAccounts.length === 0) {
                this.logger.log('No deactivated accounts to delete')
                return { notifiedCount: 0, deletedCount: 0 }
            }

            await this.notifyUsersAboutDeletion(deactivatedAccounts)

            await Promise.all(
                deactivatedAccounts.map((user) =>
                    this.deleteAccountDataFromStorage(user),
                ),
            )

            const deletedCount = await this.deleteAccounts(daysThreshold)

            this.logger.log(`Deleted ${deletedCount} deactivated accounts`)

            return {
                notifiedCount: deactivatedAccounts.length,
                deletedCount,
            }
        } catch (error) {
            this.logger.error(
                `Account deletion process failed: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async deleteSingle(user: User): Promise<boolean> {
        await this.db.delete(users).where(eq(users.id, user.id))
        await this.deleteAccountDataFromStorage(user)
        return true
    }

    private calculateThresholdDate(days: number): Date {
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - days)
        return thresholdDate
    }
}
