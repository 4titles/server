import getElasticSearchConfig from '@/config/elasticsearch.config'
import { Client } from '@elastic/elasticsearch'
import {
    BulkResponse,
    DeleteResponse,
    ExistsResponse,
    IndexResponse,
    IndicesCreateResponse,
    IndicesDeleteResponse,
    IndicesExistsResponse,
    SearchResponse,
    UpdateResponse,
} from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(ElasticsearchService.name)
    private client: Client

    constructor(private readonly configService: ConfigService) {
        const config = getElasticSearchConfig(configService)
        this.client = new Client(config)
    }

    async onModuleInit() {
        try {
            const info = await this.client.info()
            this.logger.log(
                `Connected to Elasticsearch cluster: ${info.cluster_name} [${info.version.number}]`,
            )
        } catch (error) {
            this.logger.error('Elasticsearch connection failed:', error)
            throw error
        }
    }

    async indexExists(index: string): Promise<boolean> {
        try {
            const response: IndicesExistsResponse =
                await this.client.indices.exists({ index })
            return response
        } catch (error) {
            this.logger.error(`Index exists check failed for ${index}:`, error)
            return false
        }
    }

    async documentExists(index: string, id: string): Promise<ExistsResponse> {
        try {
            return await this.client.exists({ index, id })
        } catch (error) {
            this.logger.error(`Document exists check failed for ${id}:`, error)
            return false
        }
    }

    async createIndex(
        index: string,
        settings?: Record<string, any>,
        mappings?: Record<string, any>,
    ): Promise<IndicesCreateResponse> {
        try {
            const exists = await this.indexExists(index)
            if (exists) {
                this.logger.log(`Index ${index} already exists`)
                return { acknowledged: true, index, shards_acknowledged: true }
            }

            const response = await this.client.indices.create({
                index,
                body: { settings, mappings },
            })

            this.logger.log(`Index ${index} created successfully`)
            return response
        } catch (error) {
            this.logger.error(`Index creation failed for ${index}:`, error)
            throw error
        }
    }

    async deleteIndex(index: string): Promise<IndicesDeleteResponse> {
        try {
            const exists = await this.indexExists(index)
            if (!exists) {
                this.logger.log(`Index ${index} does not exist`)
                return { acknowledged: true }
            }

            const response = await this.client.indices.delete({ index })
            this.logger.log(`Index ${index} deleted successfully`)
            return response
        } catch (error) {
            this.logger.error(`Index deletion failed for ${index}:`, error)
            throw error
        }
    }

    async indexDocument<T>(
        index: string,
        id: string,
        document: T,
        refresh: boolean = false,
    ): Promise<IndexResponse> {
        try {
            const response = await this.client.index({
                index,
                id,
                document,
                refresh,
            })
            this.logger.debug(`Document ${id} indexed in ${index}`)
            return response
        } catch (error) {
            this.logger.error(`Indexing failed for document ${id}:`, error)
            throw error
        }
    }

    async bulkIndex<T>(
        index: string,
        items: Array<{ id: string; data: T }>,
        refresh: boolean = false,
    ): Promise<BulkResponse> {
        try {
            const body = items.flatMap(({ id, data }) => [
                { index: { _index: index, _id: id } },
                data,
            ])

            const response = await this.client.bulk({
                body,
                refresh,
            })

            if (response.errors) {
                this.logger.error(
                    `Bulk indexing errors: ${response.items.length} failed items`,
                )
            } else {
                this.logger.log(
                    `Bulk indexed ${items.length} documents to ${index}`,
                )
            }

            return response
        } catch (error) {
            this.logger.error('Bulk indexing failed:', error)
            throw error
        }
    }

    async getDocument<T>(index: string, id: string): Promise<T | null> {
        try {
            const response = await this.client.get<T>({ index, id })
            return response._source ?? null
        } catch (error) {
            if (error.meta?.statusCode === 404) return null
            this.logger.error(`Failed to get document ${id}:`, error)
            throw error
        }
    }

    async updateDocument<T>(
        index: string,
        id: string,
        document: Partial<T>,
        refresh: boolean = false,
    ): Promise<UpdateResponse | null> {
        try {
            const exists = await this.documentExists(index, id)
            if (!exists) return null

            const response = await this.client.update({
                index,
                id,
                doc: document,
                refresh,
            })
            this.logger.debug(`Document ${id} updated in ${index}`)
            return response
        } catch (error) {
            this.logger.error(`Update failed for document ${id}:`, error)
            throw error
        }
    }

    async deleteDocument(
        index: string,
        id: string,
        refresh: boolean = false,
    ): Promise<DeleteResponse | null> {
        try {
            const exists = await this.documentExists(index, id)
            if (!exists) return null

            const response = await this.client.delete({
                index,
                id,
                refresh,
            })

            this.logger.debug(`Document ${id} deleted from ${index}`)
            return response
        } catch (error) {
            this.logger.error(`Delete failed for document ${id}:`, error)
            throw error
        }
    }

    async search<T>(index: string, query: any): Promise<SearchResponse<T>> {
        try {
            const response = await this.client.search<T>({
                index,
                ...query,
            })
            this.logger.debug(
                `Search executed on ${index} [${response.took}ms]`,
            )
            return response
        } catch (error) {
            this.logger.error(`Search failed on ${index}:`, error)
            throw error
        }
    }

    async refreshIndex(index: string): Promise<void> {
        try {
            await this.client.indices.refresh({ index })
            this.logger.debug(`Index ${index} refreshed`)
        } catch (error) {
            this.logger.error(`Index refresh failed for ${index}:`, error)
            throw error
        }
    }

    async updateIndexSettings(
        index: string,
        settings: Record<string, any>,
    ): Promise<void> {
        try {
            await this.client.indices.putSettings({
                index,
                body: settings,
            })
            this.logger.log(`Settings updated for index ${index}`)
        } catch (error) {
            this.logger.error(`Failed to update settings for ${index}:`, error)
            throw error
        }
    }
}
