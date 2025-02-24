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

import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { RecoveryModule } from './auth/recovery/recovery.module'
import { VerificationModule } from './auth/verification/verification.module'
import { MailModule } from './libs/mail/mail.module'

import telegrafConfig from '@/config/telegraf.config'
import geocodingConfig from '../config/geocoding.config'
import imdbConfig from '../config/imdb/imdb.config'
import redisConfig from '../config/redis/redis.config'
import tmdbConfig from '../config/tmdb.config'

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
    ],
})
export class AppModule {}
