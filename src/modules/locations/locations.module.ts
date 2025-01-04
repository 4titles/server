import { forwardRef, Module } from '@nestjs/common'
import { LocationsService } from './services/locations.service'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { GeocodingModule } from '@/modules/geocoding/geocoding.module'
import { TitlesModule } from '../titles/titles.module'

@Module({
    imports: [
        DrizzleModule,
        CacheModule,
        GeocodingModule,
        forwardRef(() => TitlesModule),
    ],
    providers: [LocationsService, ImdbParserService],
    exports: [LocationsService],
})
export class LocationsModule {}
