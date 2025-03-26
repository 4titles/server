import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Title } from '../models/title.model'
import { TitleDocumentES } from '../modules/elasticsearch/title-elasticsearch.service'
import { TitleService } from './title.service'
import { TitleElasticsearchSyncService } from './utils/title-elasticsearch-sync.service'
import { TitleTransformService } from './utils/title-transform.service'

@Injectable()
export class TitleQueryService {
    private readonly logger = new Logger(TitleQueryService.name)

    constructor(
        private readonly titleService: TitleService,
        private readonly titleElasticsearchSyncService: TitleElasticsearchSyncService,
        private readonly titleTransformService: TitleTransformService,
    ) {}

    async getTitleById(id: string): Promise<Title> {
        try {
            const dbTitle = await this.titleService.findById(id)
            if (!dbTitle) {
                throw new NotFoundException(`Title with ID ${id} not found`)
            }

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    id,
                )

            return this.combineDbAndEsTitleData(dbTitle, esTitle)
        } catch (error) {
            this.logger.error(`Error getting title by ID ${id}:`, error)
            throw error
        }
    }

    async getTitleByTmdbId(tmdbId: string): Promise<Title> {
        try {
            const dbTitle = await this.titleService.findByTmdbId(tmdbId)
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with TMDB ID ${tmdbId} not found`,
                )
            }

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    dbTitle.id,
                )

            return this.combineDbAndEsTitleData(dbTitle, esTitle)
        } catch (error) {
            this.logger.error(
                `Error getting title by TMDB ID ${tmdbId}:`,
                error,
            )
            throw error
        }
    }

    async getTitleByImdbId(imdbId: string): Promise<Title> {
        try {
            const dbTitle =
                await this.titleService.findByByImdbIdWithRelations(imdbId)
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with IMDB ID ${imdbId} not found`,
                )
            }

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    dbTitle.id,
                )

            return this.combineDbAndEsTitleData(dbTitle, esTitle)
        } catch (error) {
            this.logger.error(
                `Error getting title by IMDB ID ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    private combineDbAndEsTitleData(
        dbTitle: DbTitle,
        esTitle: TitleDocumentES | null,
    ): Title {
        const title: Partial<Title> = { ...dbTitle }

        if (esTitle && esTitle.details) {
            return this.titleTransformService.extractFullTitle(
                dbTitle,
                esTitle.details,
            )
        }

        return title as Title
    }
}
