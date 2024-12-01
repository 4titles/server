import { Injectable, Logger } from '@nestjs/common'
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

    async findByTitleId(titleId: number): Promise<Rating | null> {
        return this.ratingRepository.findOne({
            where: { title: { id: titleId } },
        })
    }

    async findOrCreate(title: Title, ratingData: IRating): Promise<Rating> {
        const existing = await this.findByTitleId(title.id)

        if (existing) {
            return existing
        }

        return this.create(title, ratingData)
    }

    async create(title: Title, ratingData: IRating): Promise<Rating> {
        const rating = this.ratingRepository.create({
            title,
            aggregateRating: ratingData.aggregate_rating,
            votesCount: ratingData.votes_count,
        })

        return this.ratingRepository.save(rating)
    }

    async update(title: Title, ratingData: IRating): Promise<Rating | null> {
        const existing = await this.findByTitleId(title.id)

        if (!existing) {
            return null
        }

        Object.assign(existing, {
            title,
            aggregateRating: ratingData.aggregate_rating,
            votesCount: ratingData.votes_count,
        })

        return this.ratingRepository.save(existing)
    }
}
