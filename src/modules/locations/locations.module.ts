import { CacheModule } from '@/modules/cache/cache.module'
import { DrizzleModule } from '@/modules/drizzle/drizzle.module'
import { GeocodingModule } from '@/modules/geocoding/geocoding.module'
import { forwardRef, Module } from '@nestjs/common'
import { TitlesModule } from '../titles/titles.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { LocationsService } from './services/locations.service'

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
