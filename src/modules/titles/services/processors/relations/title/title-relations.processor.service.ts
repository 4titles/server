import { Injectable, Logger } from '@nestjs/common'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Title } from 'src/entities/title.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

import { EntityMode } from '../base/types/entity-mode.type'
import { PosterRelationProcessorService } from './poster-relation.processor.service'
import { CertificateRelationProcessorService } from './certificate-relation.processor.service'
import { CreditRelationProcessorService } from './credit-relation.processor.service'
import { CriticReviewRelationProcessorService } from './critic-review-relation.processor.service'
import { RatingRelationProcessorService } from './rating-relation.processor.service'
import { CountryRelationProcessorService } from './country-relation.processor.service'
import { LanguageRelationProcessorService } from './language-relation.processor.service'
import { GenreRelationProcessorService } from './genre-relation.processor.service'

@Injectable()
export class TitleRelationsProcessorService {
    private readonly logger = new Logger(TitleRelationsProcessorService.name)

    constructor(
        private readonly posterProcessor: PosterRelationProcessorService,
        private readonly certificateProcessor: CertificateRelationProcessorService,
        private readonly creditProcessor: CreditRelationProcessorService,
        private readonly criticReviewProcessor: CriticReviewRelationProcessorService,
        private readonly ratingProcessor: RatingRelationProcessorService,
        private readonly countryProcessor: CountryRelationProcessorService,
        private readonly languageProcessor: LanguageRelationProcessorService,
        private readonly genreProcessor: GenreRelationProcessorService,
        @InjectRepository(Title)
        private readonly titleRepository: Repository<Title>,
    ) {}

    async processAll(
        title: Title,
        titleData: IIMDbTitle,
        mode: EntityMode,
    ): Promise<void> {
        try {
            const [
                posters,
                certificates,
                credits,
                criticReview,
                rating,
                countries,
                languages,
                genres,
            ] = await Promise.all([
                this.posterProcessor.processData(
                    title,
                    titleData.posters,
                    mode,
                ),
                this.certificateProcessor.processData(
                    title,
                    titleData.certificates,
                    mode,
                ),
                this.creditProcessor.processData(title, titleData, mode),
                this.criticReviewProcessor.processData(
                    title,
                    titleData.critic_review,
                    mode,
                ),
                this.ratingProcessor.processData(title, titleData.rating, mode),
                this.countryProcessor.processData(
                    title,
                    titleData.origin_countries,
                    mode,
                ),
                this.languageProcessor.processData(
                    title,
                    titleData.spoken_languages,
                    mode,
                ),
                this.genreProcessor.processData(title, titleData.genres, mode),
            ])

            if (posters) title.posters = posters
            if (certificates) title.certificates = certificates
            if (credits) title.credits = credits
            if (criticReview) title.criticReview = criticReview
            if (rating) title.rating = rating
            if (countries) title.originCountries = countries
            if (languages) title.spokenLanguages = languages
            if (genres) title.genres = genres

            await this.titleRepository.save(title)
        } catch (error) {
            this.logger.error(
                `Failed to process related entities for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }
}
