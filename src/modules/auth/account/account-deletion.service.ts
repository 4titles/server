import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { users } from '@/modules/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { MailService } from '@/modules/libs/mail/mail.service'
import { S3Service } from '@/modules/libs/s3/s3.service'
import { DatabaseException } from '@/modules/titles/exceptions/database.exception'
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
        private readonly s3Service: S3Service,
    ) {}

    async findDeactivatedAccounts(
        daysThreshold: number = this.DAYS_THRESHOLD,
    ): Promise<User[]> {
        try {
            const thresholdDate = this.calculateThresholdDate(daysThreshold)

            return await this.db.query.users.findMany({
                where: (users, { and, eq, lte }) =>
                    and(
                        eq(users.isDeactivated, true),
                        lte(users.deactivatedAt, thresholdDate),
                    ),
            })
        } catch (error) {
            this.logger.error(
                `Failed to find deactivated accounts: ${error.message}`,
                error.stack,
            )
            throw new DatabaseException(error)
        }
    }

    //TODO: tg notification
    async notifyUsersAboutDeletion(deactivatedAccounts: User[]): Promise<void> {
        try {
            const emailPromises = deactivatedAccounts.map((user) =>
                this.mailService
                    .sendAccountDeletion(user.email)
                    .catch((error) => {
                        this.logger.warn(
                            `Failed to send deletion email to ${user.email}: ${error.message}`,
                        )
                        return null
                    }),
            )

            await Promise.all(emailPromises)
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

    private calculateThresholdDate(days: number): Date {
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - days)
        return thresholdDate
    }
}
