import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AccountDeletionService } from '../auth/account/account-deletion.service'
import { TitleCategory } from '../titles/enums/title-category.enum'
import { TitleSyncManagerService } from '../titles/services/title-sync-manager.service'

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name)

    constructor(
        private readonly titleSyncManagerService: TitleSyncManagerService,
        private readonly accountDeletionService: AccountDeletionService,
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

    // @Cron(CronExpression.EVERY_30_MINUTES)
    @Cron(CronExpression.EVERY_YEAR)
    async syncTrendingTitles() {
        try {
            await this.titleSyncManagerService.syncCategory(
                TitleCategory.TRENDING,
            )
        } catch (error) {
            this.logger.error(
                `Failed to sync trending titles: ${error.message}`,
                error.stack,
            )
        }
    }

    // @Cron(CronExpression.EVERY_4_HOURS)
    @Cron(CronExpression.EVERY_YEAR)
    async syncPopularTitles() {
        try {
            await this.titleSyncManagerService.syncCategory(
                TitleCategory.POPULAR,
            )
        } catch (error) {
            this.logger.error(
                `Failed to sync popular titles: ${error.message}`,
                error.stack,
            )
        }
    }

    // @Cron(CronExpression.EVERY_12_HOURS)
    @Cron(CronExpression.EVERY_YEAR)
    async syncTopRatedTitles() {
        try {
            await this.titleSyncManagerService.syncCategory(
                TitleCategory.TOP_RATED,
            )
        } catch (error) {
            this.logger.error(
                `Failed to sync top rated titles: ${error.message}`,
                error.stack,
            )
        }
    }

    // @Cron(CronExpression.EVERY_DAY_AT_4AM)
    @Cron(CronExpression.EVERY_YEAR)
    async syncDailyContent() {
        try {
            await Promise.all([
                this.titleSyncManagerService.syncCategory(
                    TitleCategory.UPCOMING,
                ),
                this.titleSyncManagerService.syncCategory(TitleCategory.AIRING),
            ])
        } catch (error) {
            this.logger.error(
                `Failed to sync daily content: ${error.message}`,
                error.stack,
            )
        }
    }
}
