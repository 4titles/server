import { LoggerModule } from '@/shared/logger/logger.module'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { CliModule } from './modules/cli/cli.module'

import telegrafConfig from '@/config/telegraf.config'
import geocodingConfig from './config/geocoding.config'
import redisConfig from './config/redis/redis.config'
import tmdbConfig from './config/tmdb.config'

import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'

import { BullModule } from '@nestjs/bullmq'
import getBullMQConfig from './config/bullmq.config'
import { AuthModule } from './modules/auth/auth.module'
import { ContentModule } from './modules/content/content.module'
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module'
import { IS_DEV_ENV } from './shared/utils/common/is-dev.util'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [redisConfig, tmdbConfig, geocodingConfig, telegrafConfig],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            plugins: [
                IS_DEV_ENV
                    ? ApolloServerPluginLandingPageLocalDefault()
                    : undefined,
            ],
            playground: false,
            context: ({ req }) => ({ req }),
            buildSchemaOptions: {
                scalarsMap: [
                    { type: GraphQLUpload, scalar: GraphQLUploadScalar },
                ],
            },
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: getBullMQConfig,
            inject: [ConfigService],
        }),
        AuthModule,
        ContentModule,
        InfrastructureModule,
        CliModule,
        LoggerModule,
    ],
})
export class AppModule {}
