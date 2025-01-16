import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { TitleSyncManagerService } from '../titles/services/title-sync-manager.service'
import { TitleCategory } from '../titles/enums/title-category.enum'

@Injectable()
export class CronService {
    constructor(
        private readonly titleSyncManagerService: TitleSyncManagerService,
    ) {}

    @Cron(CronExpression.EVERY_30_MINUTES)
    async syncTrendingTitles() {
        await this.titleSyncManagerService.syncCategory(TitleCategory.TRENDING)
    }

    @Cron(CronExpression.EVERY_4_HOURS)
    async syncPopularTitles() {
        await this.titleSyncManagerService.syncCategory(TitleCategory.POPULAR)
    }

    @Cron(CronExpression.EVERY_12_HOURS)
    async syncTopRatedTitles() {
        await this.titleSyncManagerService.syncCategory(TitleCategory.TOP_RATED)
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    async syncDailyContent() {
        await Promise.all([
            this.titleSyncManagerService.syncCategory(TitleCategory.UPCOMING),
            this.titleSyncManagerService.syncCategory(TitleCategory.AIRING),
        ])
    }
}
