import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { Name, Title } from 'src/entities'
import { BaseRelationProcessor } from '../base/relation-processor.base'
import { TitleEntityService } from '../../../entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

interface IKnownForTitle {
    id: string
    primary_title: string
}

@Injectable()
export class KnownForRelationProcessorService extends BaseRelationProcessor<
    Name,
    IKnownForTitle[]
> {
    protected readonly logger = new Logger(
        KnownForRelationProcessorService.name,
    )

    constructor(
        @Inject(forwardRef(() => TitleEntityService))
        private readonly titleService: TitleEntityService,
        @InjectRepository(Name)
        private readonly nameRepository: Repository<Name>,
    ) {
        super()
    }

    shouldProcess(titles: IKnownForTitle[]): boolean {
        return Boolean(titles?.length)
    }

    async processData(
        name: Name,
        knownForTitles: IKnownForTitle[],
    ): Promise<Title[] | void> {
        try {
            const newTitles = await this.titleService.findByImdbIds(
                knownForTitles.map((t) => t.id),
            )
            const existingName = await this.nameRepository.findOne({
                where: { imdbId: name.imdbId },
                relations: ['knownFor'],
            })

            if (!existingName) return

            const existingTitleIds = new Set(
                existingName.knownFor?.map((t) => t.imdbId) || [],
            )
            const titlesToAdd = newTitles.filter(
                (title) => title && !existingTitleIds.has(title.imdbId),
            )

            if (
                !titlesToAdd.length &&
                existingName.knownFor?.length === knownForTitles.length
            ) {
                return existingName.knownFor
            }

            existingName.knownFor = [
                ...(existingName.knownFor || []),
                ...titlesToAdd,
            ]

            return existingName.knownFor
        } catch (error) {
            this.logger.error(
                `Failed to process knownFor titles for name ${name.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }
}
