import { ConflictException, Injectable, Logger } from '@nestjs/common'
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

    async create(
        title: Title,
        reviewData: ICriticReview,
    ): Promise<CriticReview> {
        const existing = await this.criticReviewRepository.findOne({
            where: { title: { id: title.id } },
        })

        if (existing) {
            throw new ConflictException(
                `Critic review for title ${title.id} already exists`,
            )
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
    ): Promise<CriticReview> {
        const existing = await this.criticReviewRepository.findOne({
            where: { title: { id: title.id } },
        })

        if (!existing) {
            return this.create(title, reviewData)
        }

        existing.score = reviewData.score
        existing.reviewCount = reviewData.review_count

        return this.criticReviewRepository.save(existing)
    }

    async deleteByTitleId(titleId: number): Promise<void> {
        await this.criticReviewRepository.delete({ title: { id: titleId } })
    }
}
