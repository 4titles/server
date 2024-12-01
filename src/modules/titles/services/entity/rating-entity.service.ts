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
        try {
            const existing = await this.findByTitleId(title.id)

            if (existing) {
                return existing
            }

            return this.create(title, ratingData)
        } catch (error) {
            this.logger.error(
                `Failed to find or create title ${title.imdbId} rating:`,
                error.stack,
            )
            throw error
        }
    }

    async create(title: Title, ratingData: IRating): Promise<Rating> {
        try {
            const rating = this.ratingRepository.create({
                title,
                aggregateRating: ratingData.aggregate_rating,
                votesCount: ratingData.votes_count,
            })

            return this.ratingRepository.save(rating)
        } catch (error) {
            this.logger.error(
                `Failed to create title ${title.imdbId} rating:`,
                error.stack,
            )
            throw error
        }
    }

    async update(title: Title, ratingData: IRating): Promise<Rating | null> {
        try {
            const existing = await this.findByTitleId(title.id)

            if (!existing) {
                return null
            }

            if (
                existing.aggregateRating === ratingData.aggregate_rating &&
                existing.votesCount === ratingData.votes_count
            ) {
                return existing
            }

            Object.assign(existing, {
                title,
                aggregateRating: ratingData.aggregate_rating,
                votesCount: ratingData.votes_count,
            })

            return this.ratingRepository.save(existing)
        } catch (error) {
            this.logger.error(
                `Failed to update title ${title.imdbId} rating:`,
                error.stack,
            )
            throw error
        }
    }
}
