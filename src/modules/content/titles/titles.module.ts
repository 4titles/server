import { Module } from '@nestjs/common'
import { GeocodingModule } from './modules/geocoding/geocoding.module'
import { LocationsModule } from './modules/locations/locations.module'
import { TmdbModule } from './modules/tmdb/tmdb.module'
import { TitlesResolver } from './titles.resolver'
import { TitlesService } from './titles.service'

@Module({
    providers: [
        LocationsModule,
        TmdbModule,
        GeocodingModule,
        TitlesService,
        TitlesResolver,
    ],
    exports: [TitlesService],
})
export class TitlesModule {}
