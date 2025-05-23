import { Module } from '@nestjs/common'
import { GeocodingModule } from '../content/title/modules/geocoding/geocoding.module'
import { TmdbModule } from '../content/title/modules/tmdb/tmdb.module'
import { AiModule } from './ai/ai.module'
import { CacheModule } from './cache/cache.module'
import { CronModule } from './cron/cron.module'
import { DrizzleModule } from './drizzle/drizzle.module'
import { AppElasticsearchModule } from './elasticsearch/elasticsearch.module'
import { HealthModule } from './health/health.module'
import { MailModule } from './mail/mail.module'
import { NotificationModule } from './notification/notification.module'
import { S3Module } from './s3/s3.module'
import { TelegramModule } from './telegram/telegram.module'

@Module({
    imports: [
        AiModule,
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
        AppElasticsearchModule,
    ],
})
export class InfrastructureModule {}
