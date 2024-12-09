import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { ConfigModule } from '@nestjs/config'
import { DrizzleModule } from './drizzle/drizzle.module'
import { CacheModule } from './cache/cache.module'
import { TitlesModule } from './titles/titles.module'
import { TmdbModule } from './tmdb/tmdb.module'
import { LocationsModule } from './locations/locations.module'
import { GeocodingModule } from './geocoding/geocoding.module'
import redisConfig from './config/redis.config'
import tmdbConfig from './config/tmdb.config'
import geocodingConfig from './config/geocoding.config'
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [redisConfig, tmdbConfig, geocodingConfig],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            playground: false,
        }),
        DrizzleModule,
        CacheModule,
        TitlesModule,
        TmdbModule,
        LocationsModule,
        GeocodingModule,
    ],
})
export class AppModule {}
