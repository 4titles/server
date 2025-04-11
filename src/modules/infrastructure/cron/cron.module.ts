import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationModule } from '../notification/notification.module'
import { CronService } from './services/cron.service'
import { TokenCleanupService } from './services/token-cleanup.service'

@Module({
    imports: [ScheduleModule.forRoot(), NotificationModule],
    providers: [CronService, TokenCleanupService],
})
export class CronModule {}
