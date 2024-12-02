import { Injectable, Logger } from '@nestjs/common'
import { Title } from 'src/entities/title.entity'
import { Poster } from 'src/entities/poster.entity'
import { IPoster } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { PosterEntityService } from '../../../entity/poster-entity.service'
import { BaseRelationProcessor } from '../base/relation-processor.base'
import { EntityMode } from '../base/types/entity-mode.type'

@Injectable()
export class PosterRelationProcessorService extends BaseRelationProcessor<
    Title,
    IPoster[]
> {
    protected readonly logger = new Logger(PosterRelationProcessorService.name)

    constructor(private readonly posterService: PosterEntityService) {
        super()
    }

    shouldProcess(posters: IPoster[]): boolean {
        return Boolean(posters?.length)
    }

    async processData(
        title: Title,
        posters: IPoster[],
        mode: EntityMode,
    ): Promise<Poster[] | void> {
        return mode === 'create'
            ? await this.posterService.findOrCreateMany(title, posters)
            : await this.posterService.updateMany(title, posters)
    }
}
