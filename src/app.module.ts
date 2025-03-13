import { LoggerModule } from '@/shared/logger/logger.module'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { CliModule } from './modules/cli/cli.module'

import telegrafConfig from '@/config/telegraf.config'
import geocodingConfig from './config/geocoding.config'
import imdbConfig from './config/imdb/imdb.config'
import redisConfig from './config/redis/redis.config'
import tmdbConfig from './config/tmdb.config'

import { GraphQLUploadScalar } from '@/shared/scalars/gql-upload.scalar'
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js'

import { AuthModule } from './modules/auth/auth.module'
import { ContentModule } from './modules/content/content.module'
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module'

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
        AuthModule,
        ContentModule,
        InfrastructureModule,
        CliModule,
        LoggerModule,
    ],
})
export class AppModule {}
