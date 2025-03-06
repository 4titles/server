import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountModule } from '../auth/account/account.module'
import { TitlesModule } from '../titles/titles.module'
import { CronService } from './services/cron.service'
import { TokenCleanupService } from './services/token-cleanup.service'

@Module({
    imports: [ScheduleModule.forRoot(), TitlesModule, AccountModule],
    providers: [CronService, TokenCleanupService],
})
export class CronModule {}
