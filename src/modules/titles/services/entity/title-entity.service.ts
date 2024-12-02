import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Title, TitleType } from 'src/entities/title.entity'
import { IIMDbTitle } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'
import { TitleRelationsProcessorService } from '../processors/relations/title/title-relations.processor.service'

@Injectable()
export class TitleEntityService {
    private readonly logger = new Logger(TitleEntityService.name)

    private readonly defaultRelations: string[] = [
        'rating',
        'posters.language',
        'certificates.country',
        'spokenLanguages',
        'originCountries',
        'criticReview',
        'credits.name.avatars',
        'credits.name.knownFor',
        'genres',
    ] as const

    constructor(
        @InjectRepository(Title)
        private readonly titleRepository: Repository<Title>,
        private readonly titleRelationsProcessor: TitleRelationsProcessorService,
    ) {}

    async findByImdbId(
        imdbId: string,
        relations: string[] = this.defaultRelations,
    ): Promise<Title | null> {
        return this.titleRepository.findOne({
            where: { imdbId },
            relations,
        })
    }

    async findByImdbIds(
        imdbIds: string[],
        relations: string[] = this.defaultRelations,
    ): Promise<Title[]> {
        if (!imdbIds?.length) return []

        return this.titleRepository.find({
            where: { imdbId: In(imdbIds) },
            relations,
        })
    }

    async findByType(
        type: TitleType,
        relations: string[] = this.defaultRelations,
    ): Promise<Title[]> {
        return this.titleRepository.find({
            where: { type },
            relations,
        })
    }

    async create(titleData: IIMDbTitle): Promise<Title> {
        try {
            const existing = await this.findByImdbId(titleData.id)

            if (existing) {
                return existing
            }

            const title = this.titleRepository.create(
                this.mapTitleData(titleData),
            )

            const savedTitle = await this.titleRepository.save(title)

            await this.titleRelationsProcessor.processAll(
                savedTitle,
                titleData,
                'create',
            )

            return this.findByImdbId(savedTitle.imdbId)
        } catch (error) {
            this.logger.error(
                `Failed to create title ${titleData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    async update(existing: Title, titleData: IIMDbTitle): Promise<Title> {
        try {
            const updatedTitle = Object.assign(
                existing,
                this.mapTitleData(titleData),
            )
            const savedTitle = await this.titleRepository.save(updatedTitle)

            await this.titleRelationsProcessor.processAll(
                savedTitle,
                titleData,
                'update',
            )
            return this.findByImdbId(savedTitle.imdbId)
        } catch (error) {
            this.logger.error(
                `Failed to update title ${titleData.id}:`,
                error.stack,
            )
            throw error
        }
    }

    private mapTitleData(data: IIMDbTitle): Partial<Title> {
        return {
            imdbId: data.id,
            type: data.type as TitleType,
            isAdult: data.is_adult,
            primaryTitle: data.primary_title,
            originalTitle: data.original_title,
            startYear: data.start_year,
            endYear: data.end_year,
            runtimeMinutes: data.runtime_minutes,
            plot: data.plot,
        }
    }
}
