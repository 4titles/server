import { Injectable, Logger } from '@nestjs/common'
import { BaseRelationProcessor } from '../base/relation-processor.base'
import { Title } from 'src/entities/title.entity'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { CreditEntityService } from '../../../entity/credit-entity.service'
import { Credit } from 'src/entities/credit.entity'
import { EntityMode } from '../base/types/entity-mode.type'

@Injectable()
export class CreditRelationProcessorService extends BaseRelationProcessor<
    Title,
    IIMDbTitle
> {
    protected readonly logger = new Logger(CreditRelationProcessorService.name)

    constructor(private readonly creditService: CreditEntityService) {
        super()
    }

    shouldProcess(titleData: IIMDbTitle): boolean {
        return Boolean(
            titleData.directors?.length ||
                titleData.writers?.length ||
                titleData.casts?.length,
        )
    }

    async processData(
        title: Title,
        titleData: IIMDbTitle,
        mode: EntityMode,
    ): Promise<Credit[] | void> {
        return mode === 'create'
            ? await this.creditService.createMany(title, titleData)
            : await this.creditService.updateMany(title, titleData)
    }
}
