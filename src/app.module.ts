import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { join } from 'path'
import { PlacesModule } from './modules/places/places.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import geoapifyConfig from './config/geoapify.config'
import redisConfig from './config/redis.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './config/typeorm.config'
import { TitlesModule } from './modules/titles/titles.module'
import imdbTop100Config from './config/imdb-top100.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                geoapifyConfig,
                redisConfig,
                typeormConfig,
                imdbTop100Config,
            ],
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
        PlacesModule,
        TitlesModule,
    ],
})
export class AppModule {}
