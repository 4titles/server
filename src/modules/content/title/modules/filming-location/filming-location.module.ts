import { GeocodingModule } from '@/modules/content/title/modules/geocoding/geocoding.module'
import { forwardRef, Module } from '@nestjs/common'
import { TitleModule } from '../../title.module'
import { CountryModule } from '../country/country.module'
import { FilmingLocationResolver } from './filming-location.resolver'
import { FilmingLocationParserService } from './services/filming-location-parser.service'
import { FilmingLocationService } from './services/filming-location.service'

@Module({
    imports: [GeocodingModule, forwardRef(() => TitleModule), CountryModule],
    providers: [
        FilmingLocationService,
        FilmingLocationResolver,
        FilmingLocationParserService,
    ],
    exports: [FilmingLocationService, FilmingLocationParserService],
})
export class FilmingLocationModule {}
