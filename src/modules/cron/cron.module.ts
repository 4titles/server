import { Module } from '@nestjs/common'
import { CronService } from './cron.service'
import { ScheduleModule } from '@nestjs/schedule'
import { TitlesModule } from '../titles/titles.module'

@Module({
    imports: [ScheduleModule.forRoot(), TitlesModule],
    providers: [CronService],
})
export class CronModule {}
