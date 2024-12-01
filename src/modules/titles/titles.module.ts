import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HttpModule } from '@nestjs/axios'

// Modules
import { IMDBModule } from '../imdb/imdb.module'
import { CacheModule } from '../cache/cache.module'

// Entities
import { RawTitle } from 'src/entities/raw_title.entity'
import { Title } from 'src/entities/title.entity'
import { Name } from 'src/entities/name.entity'
import { Credit } from 'src/entities/credit.entity'
import { Country } from 'src/entities/country.entity'
import { Language } from 'src/entities/language.entity'
import { Certificate } from 'src/entities/certificate.entity'
import { Poster } from 'src/entities/poster.entity'
import { CriticReview } from 'src/entities/critic-review.entity'
import { Avatar } from 'src/entities/avatar.entity'
import { Rating } from 'src/entities/rating.entity'

// Services
import { TitlesService } from './services/titles.service'
import { RawTitleProcessorService } from './services/processors/raw-title-processor.service'
import { RawTitleEntityService } from './services/entity/raw-title-entity.service'
import { TitleEntityService } from './services/entity/title-entity.service'
import { NameEntityService } from './services/entity/name-entity.service'
import { CreditEntityService } from './services/entity/credit-entity.service'
import { PosterEntityService } from './services/entity/poster-entity.service'
import { CertificateEntityService } from './services/entity/certificate-entity.service'
import { CriticReviewEntityService } from './services/entity/critic-review-entity.service'
import { AvatarEntityService } from './services/entity/avatar-entity.service'
import { RatingEntityService } from './services/entity/rating-entity.service'
import { CountryEntityService } from './services/entity/country-entity.service'
import { LanguageEntityService } from './services/entity/language-entity.service'

// Resolvers
import { TitlesResolver } from './resolvers/titles.resolver'

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RawTitle,
            Title,
            Name,
            Credit,
            Country,
            Language,
            Certificate,
            Poster,
            CriticReview,
            Avatar,
            Rating,
        ]),
        HttpModule,
        IMDBModule,
        CacheModule,
    ],
    providers: [
        // Main Services
        TitlesService,
        RawTitleProcessorService,

        // Entity Services
        RawTitleEntityService,
        TitleEntityService,
        NameEntityService,
        CreditEntityService,
        PosterEntityService,
        CertificateEntityService,
        CriticReviewEntityService,
        AvatarEntityService,
        RatingEntityService,
        CountryEntityService,
        LanguageEntityService,

        // Resolvers
        TitlesResolver,
    ],
    exports: [TitlesService],
})
export class TitlesModule {}
