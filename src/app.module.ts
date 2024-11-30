import { ImdbTop100Module } from './modules/imdb-top100/imdb-top100.module'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { join } from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'
import redisConfig from './config/redis.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './config/typeorm.config'
import { TitlesModule } from './modules/titles/titles.module'
import imdbTop100Config from './config/imdb-top100.config'
import { CacheModule } from './modules/cache/cache.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [redisConfig, typeormConfig, imdbTop100Config],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            typePaths: ['./**/*.graphql'],
            definitions: {
                path: join(process.cwd(), 'src/graphql.ts'),
            },
            playground: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) =>
                configService.get('typeorm'),
        }),
        TitlesModule,
        ImdbTop100Module,
        CacheModule,
    ],
})
export class AppModule {}
