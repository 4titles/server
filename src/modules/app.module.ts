import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { AccountModule } from './auth/account/account.module'
import { SessionModule } from './auth/session/session.module'
import { CacheModule } from './cache/cache.module'
import { CliModule } from './cli/cli.module'
import { CronModule } from './cron/cron.module'
import { DrizzleModule } from './drizzle/drizzle.module'
import { TelegramModule } from './libs/telegram/telegram.module'
import { TitlesModule } from './titles/titles.module'

import { LoggerModule } from '@/shared/logger/logger.module'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { DeactivateModule } from './auth/deactivate/deactivate.module'
import { ProfileModule } from './auth/profile/profile.module'
import { RecoveryModule } from './auth/recovery/recovery.module'
import { TotpModule } from './auth/totp/totp.module'
import { VerificationModule } from './auth/verification/verification.module'
import { FeedbackModule } from './feedback/feedback.module'
import { FollowModule } from './follow/follow.module'
import { HealthModule } from './health/health.module'
import { MailModule } from './libs/mail/mail.module'
import { S3Module } from './libs/s3/s3.module'
import { NotificationModule } from './notification/notification.module'

import telegrafConfig from '@/config/telegraf.config'
import geocodingConfig from '../config/geocoding.config'
import imdbConfig from '../config/imdb/imdb.config'
import redisConfig from '../config/redis/redis.config'
import tmdbConfig from '../config/tmdb.config'

import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                redisConfig,
                tmdbConfig,
                geocodingConfig,
                imdbConfig,
                telegrafConfig,
            ],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            playground: false,
            context: ({ req }) => ({ req }),
            buildSchemaOptions: {
                scalarsMap: [
                    { type: GraphQLUpload, scalar: GraphQLUploadScalar },
                ],
            },
        }),
        DrizzleModule,
        CacheModule,
        CliModule,
        TitlesModule,
        CronModule,
        TelegramModule,
        AccountModule,
        SessionModule,
        MailModule,
        VerificationModule,
        RecoveryModule,
        TotpModule,
        DeactivateModule,
        HealthModule,
        S3Module,
        ProfileModule,
        NotificationModule,
        FollowModule,
        FeedbackModule,
        LoggerModule,
    ],
})
export class AppModule {}
