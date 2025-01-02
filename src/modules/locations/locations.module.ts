import { forwardRef, Module } from '@nestjs/common'
import { LocationsService } from './services/locations.service'
import { DrizzleModule } from 'src/drizzle/drizzle.module'
import { CacheModule } from '@/modules/cache/cache.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { LocationsResolver } from './resolvers/locations.resolver'
import { GeocodingModule } from '@/modules/geocoding/geocoding.module'
import { TitlesModule } from '../titles/titles.module'
import { TitleEntityService } from '../titles/services/entity/title-entity.service'

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
