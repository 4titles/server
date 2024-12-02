import { CertificateEntityService } from 'src/modules/titles/services/entity/certificate-entity.service'
import { CountryEntityService } from 'src/modules/titles/services/entity/country-entity.service'
import { CreditEntityService } from 'src/modules/titles/services/entity/credit-entity.service'
import { CriticReviewEntityService } from 'src/modules/titles/services/entity/critic-review-entity.service'
import { GenreEntityService } from 'src/modules/titles/services/entity/genre-entity.service'
import { LanguageEntityService } from 'src/modules/titles/services/entity/language-entity.service'
import { PosterEntityService } from 'src/modules/titles/services/entity/poster-entity.service'
import { RatingEntityService } from 'src/modules/titles/services/entity/rating-entity.service'

export interface RelationProcessorConfig {
    posterService: PosterEntityService
    ratingService: RatingEntityService
    certificateService: CertificateEntityService
    creditService: CreditEntityService
    criticReviewService: CriticReviewEntityService
    countryService: CountryEntityService
    languageService: LanguageEntityService
    genreService: GenreEntityService
}
