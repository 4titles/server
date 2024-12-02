import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { ICriticReview } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { BaseRelationProcessor } from './base/relation-processor.base'
import { CriticReviewEntityService } from '../../entity/critic-review-entity.service'
import { CriticReview } from 'src/entities/critic-review.entity'
import { EntityMode } from './base/types/entity-mode.type'

@Injectable()
export class CriticReviewRelationProcessor extends BaseRelationProcessor<
    Title,
    ICriticReview
> {
    protected readonly logger = new Logger(CriticReviewRelationProcessor.name)

    constructor(
        private readonly criticReviewService: CriticReviewEntityService,
    ) {
        super()
    }

    shouldProcess(criticReview: ICriticReview): boolean {
        return Boolean(criticReview)
    }

    async processData(
        title: Title,
        criticReview: ICriticReview,
        mode: EntityMode,
    ): Promise<CriticReview> {
        return mode === 'create'
            ? await this.criticReviewService.create(title, criticReview)
            : await this.criticReviewService.update(title, criticReview)
    }
}
