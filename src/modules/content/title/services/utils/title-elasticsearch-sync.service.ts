import { Injectable, Logger } from '@nestjs/common'
import { TmdbTitleDataDTO } from '../../dto/tmdb-title-data.dto'
import {
    TitleDocumentES,
    TitleElasticsearchService,
} from '../../modules/elasticsearch/title-elasticsearch.service'

@Injectable()
export class TitleElasticsearchSyncService {
    private readonly logger = new Logger(TitleElasticsearchSyncService.name)

    constructor(
        private readonly titleElasticsearchService: TitleElasticsearchService,
    ) {}

    async syncTitleWithElasticsearch(
        titleId: string,
        tmdbData: TmdbTitleDataDTO,
    ): Promise<boolean> {
        try {
            const { titleDetails } = tmdbData

            const elasticData: TitleDocumentES = {
                tmdbId: String(titleDetails.id),
                details: titleDetails,
            }

            const result = await this.titleElasticsearchService.indexTitle(
                titleId,
                elasticData,
            )

            if (result) {
                this.logger.log(
                    `Title ${titleId} (TMDB ID: ${titleDetails.id}) successfully indexed in ElasticSearch`,
                )
            } else {
                this.logger.warn(
                    `Failed to index title ${titleId} (TMDB ID: ${titleDetails.id}) in ElasticSearch`,
                )
            }

            return result
        } catch (error) {
            this.logger.error(
                `Error syncing title ${titleId} with ElasticSearch:`,
                error,
            )
            return false
        }
    }

    async updateTitleInElasticsearch(
        titleId: string,
        tmdbData: TmdbTitleDataDTO,
    ): Promise<boolean> {
        try {
            const { titleDetails } = tmdbData

            const existingTitle =
                await this.titleElasticsearchService.getTitle(titleId)
            if (!existingTitle) {
                this.logger.warn(
                    `Title ${titleId} (TMDB ID: ${titleDetails.id}) not found in ElasticSearch, creating new document`,
                )
                return await this.syncTitleWithElasticsearch(titleId, tmdbData)
            }

            const elasticData: Partial<TitleDocumentES> = {
                tmdbId: String(titleDetails.id),
                details: titleDetails,
            }

            const result = await this.titleElasticsearchService.updateTitle(
                titleId,
                elasticData,
            )

            if (result) {
                this.logger.log(
                    `Title ${titleId} (TMDB ID: ${titleDetails.id}) successfully updated in ElasticSearch`,
                )
            } else {
                this.logger.warn(
                    `Failed to update title ${titleId} (TMDB ID: ${titleDetails.id}) in ElasticSearch`,
                )
            }

            return result
        } catch (error) {
            this.logger.error(
                `Error updating title ${titleId} in ElasticSearch:`,
                error,
            )
            return false
        }
    }

    // ??? should be moved from this service to TitleElasticSearchService?
    async deleteTitleFromElasticsearch(titleId: string): Promise<boolean> {
        try {
            const result =
                await this.titleElasticsearchService.deleteTitle(titleId)

            if (result) {
                this.logger.log(
                    `Title ${titleId} successfully deleted from ElasticSearch`,
                )
            } else {
                this.logger.warn(
                    `Failed to delete title ${titleId} from ElasticSearch`,
                )
            }

            return result
        } catch (error) {
            this.logger.error(
                `Error deleting title ${titleId} from ElasticSearch:`,
                error,
            )
            return false
        }
    }

    // ??? should be moved from this service to TitleElasticSearchService?
    async getTitleDetailsFromElasticsearch(
        titleId: string,
    ): Promise<TitleDocumentES | null> {
        try {
            const result =
                await this.titleElasticsearchService.getTitle(titleId)
            return result
        } catch (error) {
            this.logger.error(
                `Error getting title ${titleId} from ElasticSearch:`,
                error,
            )
            return null
        }
    }
}
