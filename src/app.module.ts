import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { join } from 'path'
import { PlacesModule } from './modules/places/places.module'
import { ConfigModule } from '@nestjs/config'
import geoapifyConfig from './config/geoapify.config'
import redisConfig from './config/redis.config'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [geoapifyConfig, redisConfig],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            typePaths: ['./**/*.graphql'],
            definitions: {
                path: join(process.cwd(), 'src/graphql.ts'),
            },
            playground: true,
        }),
        PlacesModule,
    ],
})
export class AppModule {}
