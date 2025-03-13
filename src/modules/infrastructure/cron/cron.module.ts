import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TitlesModule } from '../../content/titles/titles.module'
import { CronService } from './services/cron.service'
import { TokenCleanupService } from './services/token-cleanup.service'

@Module({
    imports: [ScheduleModule.forRoot(), TitlesModule],
    providers: [CronService, TokenCleanupService],
})
export class CronModule {}
