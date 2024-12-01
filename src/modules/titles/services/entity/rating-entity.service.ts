import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Rating } from 'src/entities/rating.entity'
import { Title } from 'src/entities/title.entity'
import { IRating } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { Repository } from 'typeorm'

@Injectable()
export class RatingEntityService {
    private readonly logger = new Logger(RatingEntityService.name)

    constructor(
        @InjectRepository(Rating)
        private readonly ratingRepository: Repository<Rating>,
    ) {}

    async create(title: Title, ratingData: IRating): Promise<Rating> {
        const existing = await this.ratingRepository.findOne({
            where: { title: { id: title.id } },
        })

        if (existing) {
            throw new ConflictException(
                `Rating for title ${title.id} already exists`,
            )
        }

        const rating = this.ratingRepository.create({
            title,
            aggregateRating: ratingData.aggregate_rating,
            votesCount: ratingData.votes_count,
        })

        return this.ratingRepository.save(rating)
    }

    async update(title: Title, ratingData: IRating): Promise<Rating> {
        const existing = await this.ratingRepository.findOne({
            where: { title: { id: title.id } },
        })

        if (!existing) {
            return this.create(title, ratingData)
        }

        existing.aggregateRating = ratingData.aggregate_rating
        existing.votesCount = ratingData.votes_count

        return this.ratingRepository.save(existing)
    }

    async deleteByTitleId(titleId: number): Promise<void> {
        await this.ratingRepository.delete({ title: { id: titleId } })
    }
}
