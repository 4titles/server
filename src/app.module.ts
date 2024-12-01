import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { join } from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'
import redisConfig from './config/redis.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './config/typeorm.config'
import { TitlesModule } from './modules/titles/titles.module'
import { CacheModule } from './modules/cache/cache.module'
import { IMDBModule } from './modules/imdb/imdb.module'
import imdbConfig from './modules/imdb/config/imdb.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [redisConfig, typeormConfig, imdbConfig],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            typePaths: ['./**/*.graphql'],
            definitions: {
                path: join(process.cwd(), 'src/graphql.ts'),
                outputAs: 'class',
            },
            playground: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) =>
                configService.get('typeorm'),
        }),
        TitlesModule,
        IMDBModule,
        CacheModule,
    ],
})
export class AppModule {}
