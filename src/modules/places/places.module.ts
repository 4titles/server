import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PlacesResolver } from './resolvers/places.resolver'
import { PlacesService } from './services/places.service'
import { GeoapifyService } from './services/geoapify.service'
import { CacheService } from './services/cache.service'
import { PlacesRepository } from './repositories/places.repository'

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: configService.get('geoapify.timeout'),
                maxRedirects: 5,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        PlacesResolver,
        PlacesService,
        GeoapifyService,
        CacheService,
        PlacesRepository,
    ],
    exports: [PlacesService],
})
export class PlacesModule {}
