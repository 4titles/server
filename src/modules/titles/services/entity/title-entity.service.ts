import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Title, TitleType } from 'src/entities/title.entity'
import {
    ICountry,
    IIMDbTitle,
    ILanguage,
} from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'
import { PosterEntityService } from './poster-entity.service'
import { RatingEntityService } from './rating-entity.service'
import { CreditEntityService } from './credit-entity.service'
import { CriticReviewEntityService } from './critic-review-entity.service'
import { CertificateEntityService } from './certificate-entity.service'
import { CountryEntityService } from './country-entity.service'
import { LanguageEntityService } from './language-entity.service'

@Injectable()
export class TitleEntityService {
    private readonly logger = new Logger(TitleEntityService.name)
    private readonly defaultRelations = {
        rating: true,
        posters: {
            language: true,
        },
        certificates: {
            country: true,
        },
        spokenLanguages: true,
        originCountries: true,
        criticReview: true,
        credits: {
            name: {
                avatars: true,
            },
        },
    } as const

    constructor(
        @InjectRepository(Title)
        private readonly titleRepository: Repository<Title>,
        private readonly ratingService: RatingEntityService,
        private readonly posterService: PosterEntityService,
        private readonly certificateService: CertificateEntityService,
        private readonly creditService: CreditEntityService,
        private readonly criticReviewService: CriticReviewEntityService,
        private readonly countryService: CountryEntityService,
        private readonly languageService: LanguageEntityService,
    ) {}

    async findByImdbId(imdbId: string): Promise<Title | null> {
        return this.titleRepository.findOne({
            where: { imdbId },
            relations: this.defaultRelations,
        })
    }

    async findByImdbIds(imdbIds: string[]): Promise<Title[]> {
        if (!imdbIds?.length) return []

        return this.titleRepository.find({
            where: { imdbId: In(imdbIds) },
            relations: this.defaultRelations,
        })
    }

    async findByType(type: TitleType): Promise<Title[]> {
        return this.titleRepository.find({
            where: { type },
            relations: this.defaultRelations,
        })
    }

    async create(titleData: IIMDbTitle): Promise<Title> {
        try {
            const existing = await this.findByImdbId(titleData.id)

            if (existing) {
                return existing
            }

            const title = this.titleRepository.create(
                this.mapTitleData(titleData),
            )
            const savedTitle = await this.titleRepository.save(title)

            await this.processRelatedEntities(savedTitle, titleData, 'create')
            return savedTitle
        } catch (error) {
            this.logger.error(
                `Failed to create title ${titleData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    async update(existing: Title, titleData: IIMDbTitle): Promise<Title> {
        const updatedTitle = Object.assign(
            existing,
            this.mapTitleData(titleData),
        )
        const savedTitle = await this.titleRepository.save(updatedTitle)

        await this.processRelatedEntities(savedTitle, titleData, 'update')
        return this.findByImdbId(savedTitle.imdbId)
    }

    private async processRelatedEntities(
        title: Title,
        titleData: IIMDbTitle,
        mode: 'create' | 'update',
    ): Promise<void> {
        try {
            const operations = this.getRelatedEntityOperations(
                title,
                titleData,
                mode,
            )
            await Promise.all(operations.filter(Boolean))
        } catch (error) {
            this.logger.error(
                `Failed to ${mode} related entities for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }

    private getRelatedEntityOperations(
        title: Title,
        titleData: IIMDbTitle,
        mode: 'create' | 'update',
    ): Promise<any>[] {
        const operations = []

        if (titleData.rating) {
            operations.push(
                mode === 'create'
                    ? this.ratingService.create(title, titleData.rating)
                    : this.ratingService.update(title, titleData.rating),
            )
        }

        if (titleData.posters?.length) {
            operations.push(
                mode === 'create'
                    ? this.posterService.createMany(title, titleData.posters)
                    : this.posterService.updateMany(title, titleData.posters),
            )
        }

        if (titleData.certificates?.length) {
            operations.push(
                mode === 'create'
                    ? this.certificateService.createMany(
                          title,
                          titleData.certificates,
                      )
                    : this.certificateService.updateMany(
                          title,
                          titleData.certificates,
                      ),
            )
        }

        if (
            titleData.directors?.length ||
            titleData.writers?.length ||
            titleData.casts?.length
        ) {
            operations.push(
                mode === 'create'
                    ? this.creditService.createMany(title, titleData)
                    : this.creditService.updateMany(title, titleData),
            )
        }

        if (titleData.critic_review) {
            operations.push(
                mode === 'create'
                    ? this.criticReviewService.create(
                          title,
                          titleData.critic_review,
                      )
                    : this.criticReviewService.update(
                          title,
                          titleData.critic_review,
                      ),
            )
        }

        if (titleData.origin_countries?.length) {
            operations.push(
                this.processOriginCountries(title, titleData.origin_countries),
            )
        }

        if (titleData.spoken_languages?.length) {
            operations.push(
                this.processSpokenLanguages(title, titleData.spoken_languages),
            )
        }

        return operations
    }

    private async processOriginCountries(
        title: Title,
        countries: ICountry[],
    ): Promise<void> {
        const countryEntities =
            await this.countryService.findOrCreateMany(countries)

        await this.countryService.updateMany(countries)

        await this.titleRepository
            .createQueryBuilder()
            .relation(Title, 'originCountries')
            .of(title)
            .addAndRemove(
                countryEntities.map((c) => c.id),
                title.originCountries?.map((c) => c.id) || [],
            )
    }

    private async processSpokenLanguages(
        title: Title,
        languages: ILanguage[],
    ): Promise<void> {
        const languageEntities =
            await this.languageService.findOrCreateMany(languages)

        await this.languageService.updateMany(languages)

        await this.titleRepository
            .createQueryBuilder()
            .relation(Title, 'spokenLanguages')
            .of(title)
            .addAndRemove(
                languageEntities.map((l) => l.id),
                title.spokenLanguages?.map((l) => l.id) || [],
            )
    }

    private mapTitleData(data: IIMDbTitle): Partial<Title> {
        return {
            imdbId: data.id,
            type: data.type as TitleType,
            isAdult: data.is_adult,
            primaryTitle: data.primary_title,
            originalTitle: data.original_title,
            startYear: data.start_year,
            endYear: data.end_year,
            runtimeMinutes: data.runtime_minutes,
            plot: data.plot,
            genres: data.genres,
        }
    }
}
