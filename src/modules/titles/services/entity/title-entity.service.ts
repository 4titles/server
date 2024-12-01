import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Title, TitleType } from 'src/entities/title.entity'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'
import { PosterEntityService } from './poster-entity.service'
import { RatingEntityService } from './rating-entity.service'
import { CreditEntityService } from './credit-entity.service'
import { CriticReviewEntityService } from './critic-review-entity.service'
import { CertificateEntityService } from './certificate-entity.service'

@Injectable()
export class TitleEntityService {
    private readonly logger = new Logger(TitleEntityService.name)

    constructor(
        @InjectRepository(Title)
        private readonly titleRepository: Repository<Title>,
        private readonly ratingService: RatingEntityService,
        private readonly posterService: PosterEntityService,
        private readonly certificateService: CertificateEntityService,
        private readonly creditService: CreditEntityService,
        private readonly criticReviewService: CriticReviewEntityService,
    ) {}

    async findByImdbId(imdbId: string): Promise<Title | null> {
        return this.titleRepository.findOne({ where: { imdbId } })
    }

    async create(titleData: IIMDbTitle): Promise<Title> {
        const existingTitle = await this.findByImdbId(titleData.id)
        if (existingTitle) {
            throw new ConflictException(
                `Title with IMDb ID ${titleData.id} already exists`,
            )
        }

        const title = this.titleRepository.create(this.mapTitleData(titleData))
        const savedTitle = await this.titleRepository.save(title)

        await this.createRelatedEntities(savedTitle, titleData)
        return savedTitle
    }

    async update(existingTitle: Title, titleData: IIMDbTitle): Promise<Title> {
        const updatedTitle = Object.assign(
            existingTitle,
            this.mapTitleData(titleData),
        )
        const savedTitle = await this.titleRepository.save(updatedTitle)

        await this.updateRelatedEntities(savedTitle, titleData)
        return savedTitle
    }

    private async createRelatedEntities(
        title: Title,
        titleData: IIMDbTitle,
    ): Promise<void> {
        await Promise.all([
            this.ratingService.create(title, titleData.rating),
            this.posterService.createMany(title, titleData.posters),
            this.certificateService.createMany(title, titleData.certificates),
            this.creditService.createMany(title, titleData),
            titleData.critic_review &&
                this.criticReviewService.create(title, titleData.critic_review),
        ])
    }

    private async updateRelatedEntities(
        title: Title,
        titleData: IIMDbTitle,
    ): Promise<void> {
        await Promise.all([
            this.ratingService.update(title, titleData.rating),
            this.posterService.updateMany(title, titleData.posters),
            this.certificateService.updateMany(title, titleData.certificates),
            this.creditService.updateMany(title, titleData),
            titleData.critic_review &&
                this.criticReviewService.update(title, titleData.critic_review),
        ])
    }

    private mapTitleData(data: IIMDbTitle): Partial<Title> {
        this.logger.debug(
            `Mapping title data for ${data.id}, ${data.original_title}`,
        )
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
