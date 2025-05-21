import { ApolloDriver } from '@nestjs/apollo'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'

import { LoggerModule } from '@/shared/logger/logger.module'
import { WinstonModule } from 'nest-winston'
import { AuthModule } from './modules/auth/auth.module'
import { CliModule } from './modules/cli/cli.module'
import { ContentModule } from './modules/content/content.module'
import { InfrastructureModule } from './modules/infrastructure/infrastructure.module'

import getBullMQConfig from './config/bullmq.config'
import getGraphQLConfig from './config/graphql.config'
import tmdbConfig from './config/tmdb.config'
import getWinstonConfig from './config/winston.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [tmdbConfig],
        }),
        WinstonModule.forRoot(getWinstonConfig(new ConfigService())),
        GraphQLModule.forRootAsync({
            driver: ApolloDriver,
            useFactory: getGraphQLConfig,
            inject: [ConfigService],
        }),
        BullModule.forRootAsync({
            useFactory: getBullMQConfig,
            inject: [ConfigService],
        }),
        LoggerModule,
        AuthModule,
        ContentModule,
        InfrastructureModule,
        CliModule,
    ],
})
export class AppModule {}
