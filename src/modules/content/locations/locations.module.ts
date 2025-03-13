import { GeocodingModule } from '@/modules/infrastructure/geocoding/geocoding.module'
import { forwardRef, Module } from '@nestjs/common'
import { TitlesModule } from '../titles/titles.module'
import { ImdbParserService } from './services/imdb-parser.service'
import { LocationsService } from './services/locations.service'

@Module({
    imports: [GeocodingModule, forwardRef(() => TitlesModule)],
    providers: [LocationsService, ImdbParserService],
    exports: [LocationsService],
})
export class LocationsModule {}
