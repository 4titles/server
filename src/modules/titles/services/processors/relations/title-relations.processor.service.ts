import { Injectable, Logger } from '@nestjs/common'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Title } from 'src/entities/title.entity'
import { CountryRelationProcessor } from './country-relation.processor'
import { CreditRelationProcessor } from './credit-relation.processor'
import { CertificateRelationProcessor } from './certificate-relation.processor'
import { CriticReviewRelationProcessor } from './critic-review-relation.processor'
import { GenreRelationProcessor } from './genre-relation.processor'
import { PosterRelationProcessor } from './poster-relation.processor'
import { RatingRelationProcessor } from './rating-relation.processor'
import { EntityMode } from './base/types/entity-mode.type'
import { LanguageRelationProcessor } from '.'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class TitleRelationsProcessorService {
    private readonly logger = new Logger(TitleRelationsProcessorService.name)

    constructor(
        private readonly posterProcessor: PosterRelationProcessor,
        private readonly certificateProcessor: CertificateRelationProcessor,
        private readonly creditProcessor: CreditRelationProcessor,
        private readonly criticReviewProcessor: CriticReviewRelationProcessor,
        private readonly ratingProcessor: RatingRelationProcessor,
        private readonly countryProcessor: CountryRelationProcessor,
        private readonly languageProcessor: LanguageRelationProcessor,
        private readonly genreProcessor: GenreRelationProcessor,
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
