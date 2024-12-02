import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { IRating } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { BaseRelationProcessor } from './base/relation-processor.base'
import { RatingEntityService } from '../../entity/rating-entity.service'
import { Rating } from 'src/entities/rating.entity'
import { EntityMode } from './base/types/entity-mode.type'

@Injectable()
export class RatingRelationProcessor extends BaseRelationProcessor<
    Title,
    IRating
> {
    protected readonly logger = new Logger(RatingRelationProcessor.name)

    constructor(private readonly ratingService: RatingEntityService) {
        super()
    }

    shouldProcess(rating: IRating): boolean {
        return Boolean(rating)
    }

    async processData(
        title: Title,
        rating: IRating,
        mode: EntityMode,
    ): Promise<Rating> {
        return mode === 'create'
            ? await this.ratingService.create(title, rating)
            : await this.ratingService.update(title, rating)
    }
}
