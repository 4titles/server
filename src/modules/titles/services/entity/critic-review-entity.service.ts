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

    async findByTitleId(titleId: number): Promise<CriticReview | null> {
        return this.criticReviewRepository.findOne({
            where: { title: { id: titleId } },
        })
    }

    async create(
        title: Title,
        reviewData: ICriticReview,
    ): Promise<CriticReview> {
        const existing = await this.findByTitleId(title.id)

        if (existing) {
            return existing
        }

        const review = this.criticReviewRepository.create({
            title,
            score: reviewData.score,
            reviewCount: reviewData.review_count,
        })

        return this.criticReviewRepository.save(review)
    }

    async update(
        title: Title,
        reviewData: ICriticReview,
    ): Promise<CriticReview | null> {
        const existing = await this.findByTitleId(title.id)

        if (!existing) {
            return null
        }

        if (
            existing.score === reviewData.score &&
            existing.reviewCount === reviewData.review_count
        ) {
            return existing
        }

        Object.assign(existing, {
            score: reviewData.score,
            reviewCount: reviewData.review_count,
        })

        return this.criticReviewRepository.save(existing)
    }
}
