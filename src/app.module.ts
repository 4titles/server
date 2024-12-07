import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { join } from 'path'
import { ConfigModule } from '@nestjs/config'
import { DrizzleModule } from './drizzle/drizzle.module'
import { CacheModule } from './cache/cache.module'
import { TitlesModule } from './titles/titles.module'
import { TmdbModule } from './tmdb/tmdb.module'
import { LocationsModule } from './locations/locations.module'
import redisConfig from './config/redis.config'
import tmdbConfig from './config/tmdb.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [redisConfig, tmdbConfig],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            typePaths: ['./**/*.graphql'],
            definitions: {
                path: join(process.cwd(), 'src/graphql.ts'),
            },
            playground: true,
        }),
        DrizzleModule,
        CacheModule,
        TitlesModule,
        TmdbModule,
        LocationsModule,
    ],
})
export class AppModule {}
