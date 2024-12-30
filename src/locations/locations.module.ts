import { forwardRef, Module } from '@nestjs/common'
import { LocationsService } from './services/locations.service'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { CacheModule } from 'src/cache/cache.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { LocationsResolver } from './resolvers/locations.resolver'
import { GeocodingModule } from 'src/geocoding/geocoding.module'
import { TitleEntityService } from '@/titles/services/entity/title-entity.service'
import { TitlesModule } from '@/titles/titles.module'

@Module({
    imports: [
        DrizzleModule,
        CacheModule,
        GeocodingModule,
        forwardRef(() => TitlesModule),
    ],
    providers: [
        LocationsService,
        ImdbParserService,
        LocationsResolver,
        TitleEntityService,
    ],
    exports: [LocationsService],
})
export class LocationsModule {}
