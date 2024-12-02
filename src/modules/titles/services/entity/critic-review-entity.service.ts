import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CriticReview } from 'src/entities/critic-review.entity'
import { Title } from 'src/entities/title.entity'
import { ICriticReview } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'

@Injectable()
export class CriticReviewEntityService {
    private readonly logger = new Logger(CriticReviewEntityService.name)

    constructor(
        @InjectRepository(CriticReview)
        private readonly criticReviewRepository: Repository<CriticReview>,
    ) {}

    async findByTitleImdbID(imdbId: string): Promise<CriticReview | null> {
        return this.criticReviewRepository.findOne({
            where: { title: { imdbId } },
            relations: ['title'],
        })
    }

    async create(
        title: Title,
        reviewData: ICriticReview,
    ): Promise<CriticReview> {
        try {
            const existing = await this.findByTitleImdbID(title.imdbId)

            if (existing) {
                return existing
            }

            const review = this.criticReviewRepository.create({
                title,
                score: reviewData?.score ?? null,
                reviewCount: reviewData?.review_count ?? null,
            })

            return this.criticReviewRepository.save(review)
        } catch (error) {
            this.logger.error(
                `Failed to create critic review for title ${title.imdbId}:`,
                error.stack,
            )
            return null
        }
    }

    async update(
        title: Title,
        reviewData: ICriticReview,
    ): Promise<CriticReview | null> {
        try {
            const existing = await this.findByTitleImdbID(title.imdbId)

            if (!existing) {
                return null
            }

            if (
                existing.score === reviewData?.score &&
                existing.reviewCount === reviewData.review_count
            ) {
                return existing
            }

            Object.assign(existing, {
                score: reviewData?.score ?? null,
                reviewCount: reviewData?.review_count ?? null,
            })

            return this.criticReviewRepository.save(existing)
        } catch (error) {
            this.logger.error(
                `Failed to update critic review for title ${title.imdbId}:`,
                error.stack,
            )
            return null
        }
    }
}
