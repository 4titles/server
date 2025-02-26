import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountModule } from '../auth/account/account.module'
import { TitlesModule } from '../titles/titles.module'
import { CronService } from './cron.service'

@Module({
    imports: [ScheduleModule.forRoot(), TitlesModule, AccountModule],
    providers: [CronService],
})
export class CronModule {}
