import { Module } from '@nestjs/common'
import { CacheModule } from './cache/cache.module'
import { CronModule } from './cron/cron.module'
import { DrizzleModule } from './drizzle/drizzle.module'
import { GeocodingModule } from './geocoding/geocoding.module'
import { HealthModule } from './health/health.module'
import { MailModule } from './mail/mail.module'
import { NotificationModule } from './notification/notification.module'
import { S3Module } from './s3/s3.module'
import { TelegramModule } from './telegram/telegram.module'
import { TmdbModule } from './tmdb/tmdb.module'

@Module({
    imports: [
        CacheModule,
        CronModule,
        DrizzleModule,
        HealthModule,
        MailModule,
        S3Module,
        TelegramModule,
        GeocodingModule,
        TmdbModule,
        NotificationModule,
    ],
})
export class InfrastructureModule {}
