import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ConfigModule } from '@nestjs/config'
import { DrizzleModule } from './drizzle/drizzle.module'
import { CacheModule } from './cache/cache.module'
import { TitlesModule } from './titles/titles.module'
import { CliModule } from './cli/cli.module'
import { CronModule } from './cron/cron.module'
import { TelegramModule } from './libs/telegram/telegram.module'
import { AccountModule } from './auth/account/account.module'
import { SessionModule } from './auth/session/session.module'

import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'

import imdbConfig from '../config/imdb/imdb.config'
import redisConfig from '../config/redis.config'
import tmdbConfig from '../config/tmdb.config'
import geocodingConfig from '../config/geocoding.config'
import telegrafConfig from '@/config/telegraf.config'

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
        }),
        DrizzleModule,
        CacheModule,
        CliModule,
        TitlesModule,
        CronModule,
        TelegramModule,
        AccountModule,
        SessionModule,
    ],
})
export class AppModule {}
