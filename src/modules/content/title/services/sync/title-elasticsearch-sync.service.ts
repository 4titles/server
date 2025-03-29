import { Injectable, Logger } from '@nestjs/common'
import { TitleElasticsearchService } from '../../modules/elasticsearch/title-elasticsearch.service'
import { TitleDocumentES } from '../../modules/elasticsearch/types/title-elasticsearch-document.interface'
import { TitleSyncData } from '../../types/title-sync-data.interface'

@Injectable()
export class TitleElasticsearchSyncService {
    private readonly logger = new Logger(TitleElasticsearchSyncService.name)

    constructor(
        private readonly titleElasticsearchService: TitleElasticsearchService,
    ) {}

    async syncTitleWithElasticsearch(
        titleId: string,
        syncData: TitleSyncData,
    ): Promise<boolean> {
        try {
            const { titleDetails } = syncData

            const result = await this.titleElasticsearchService.indexTitle(
                titleId,
                titleDetails,
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
        syncData: TitleSyncData,
    ): Promise<boolean> {
        try {
            const { titleDetails } = syncData

            const existingTitle =
                await this.titleElasticsearchService.getTitle(titleId)
            if (!existingTitle) {
                this.logger.warn(
                    `Title ${titleId} (TMDB ID: ${titleDetails.id}) not found in ElasticSearch, creating new document`,
                )
                return await this.syncTitleWithElasticsearch(titleId, syncData)
            }

            const result = await this.titleElasticsearchService.updateTitle(
                titleId,
                titleDetails,
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

    async deleteTitleFromElasticsearch(titleId: string): Promise<boolean> {
        try {
            return await this.titleElasticsearchService.deleteTitle(titleId)
        } catch (error) {
            this.logger.error(
                `Error deleting title ${titleId} from ElasticSearch:`,
                error,
            )
            return false
        }
    }

    async getTitleDetailsFromElasticsearch(
        titleId: string,
    ): Promise<TitleDocumentES | null> {
        try {
            return await this.titleElasticsearchService.getTitle(titleId)
        } catch (error) {
            this.logger.error(
                `Error getting title ${titleId} from ElasticSearch:`,
                error,
            )
            return null
        }
    }
}
