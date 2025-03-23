import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AccountDeletionService } from '../../../auth/account/account-deletion.service'
import { TokenCleanupService } from './token-cleanup.service'

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name)

    constructor(
        private readonly accountDeletionService: AccountDeletionService,
        private readonly tokenCleanupService: TokenCleanupService,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async runAccountDeletionJob() {
        this.logger.log('Starting daily account deletion job')
        try {
            const result =
                await this.accountDeletionService.processAccountDeletion()
            this.logger.log(
                `Account deletion completed: ${result.deletedCount} accounts deleted`,
            )
        } catch (error) {
            this.logger.error(
                `Account deletion job failed: ${error.message}`,
                error.stack,
            )
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async runTokenCleanupJob() {
        this.logger.log('Starting token cleanup job')
        try {
            const result = await this.tokenCleanupService.cleanupExpiredTokens()
            this.logger.log(
                `Token cleanup completed: ${result.deletedCount} tokens deleted`,
            )
        } catch (error) {
            this.logger.error(
                `Token cleanup job failed: ${error.message}`,
                error.stack,
            )
        }
    }
}
