import { GeocodingModule } from '@/modules/content/title/modules/geocoding/geocoding.module'
import { AiModule } from '@/modules/infrastructure/ai/ai.module'
import { forwardRef, Module } from '@nestjs/common'
import { TitleModule } from '../../title.module'
import { CountryModule } from '../country/country.module'
import { LanguageModule } from '../language/language.module'
import { FilmingLocationResolver } from './filming-location.resolver'
import { FilmingLocationProposalModule } from './modules/filming-location-proposal/filming-location-proposal.module'
import { FilmingLocationDescriptionService } from './services/filming-location-description.service'
import { FilmingLocationParserService } from './services/filming-location-parser.service'
import { FilmingLocationService } from './services/filming-location.service'

@Module({
    imports: [
        GeocodingModule,
        forwardRef(() => TitleModule),
        CountryModule,
        AiModule,
        LanguageModule,
        forwardRef(() => FilmingLocationProposalModule),
    ],
    providers: [
        FilmingLocationService,
        FilmingLocationResolver,
        FilmingLocationParserService,
        FilmingLocationDescriptionService,
    ],
    exports: [
        FilmingLocationService,
        FilmingLocationParserService,
        FilmingLocationDescriptionService,
    ],
})
export class FilmingLocationModule {}
