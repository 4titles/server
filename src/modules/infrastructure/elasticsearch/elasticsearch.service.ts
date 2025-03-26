import { Client } from '@elastic/elasticsearch'
import {
    BulkResponse,
    DeleteResponse,
    IndexResponse,
    IndicesCreateResponse,
    IndicesDeleteResponse,
    SearchResponse,
    UpdateResponse,
} from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(ElasticsearchService.name)
    private client: Client

    constructor(private configService: ConfigService) {
        this.client = new Client({
            node: this.configService.get('ELASTICSEARCH_NODE'),
            auth: {
                username: this.configService.get('ELASTICSEARCH_USERNAME'),
                password: this.configService.get('ELASTICSEARCH_PASSWORD'),
            },
        })
    }

    async onModuleInit() {
        try {
            await this.client.ping()
            this.logger.log('Elasticsearch connection successful')
        } catch (error) {
            this.logger.error('Elasticsearch connection failed:', error)
            throw error
        }
    }

    async createIndex(
        index: string,
        settings?: any,
        mappings?: any,
    ): Promise<IndicesCreateResponse> {
        const exists = await this.client.indices.exists({ index })
        if (!exists) {
            return await this.client.indices.create({
                index,
                body: {
                    settings,
                    mappings,
                },
            })
        }
        return {
            acknowledged: true,
            index,
            shards_acknowledged: true,
        }
    }

    async deleteIndex(index: string): Promise<IndicesDeleteResponse> {
        const exists = await this.client.indices.exists({ index })
        if (exists) {
            return await this.client.indices.delete({ index })
        }
        return { acknowledged: true }
    }

    async indexDocument<T>(
        index: string,
        id: string,
        document: T,
    ): Promise<IndexResponse> {
        return await this.client.index({
            index,
            id,
            document,
        })
    }

    async bulkIndex<T>(
        index: string,
        items: Array<{ id: string; data: T }>,
    ): Promise<BulkResponse> {
        const body = items.flatMap((item) => [
            { index: { _index: index, _id: item.id } },
            item.data,
        ])

        return await this.client.bulk({ body })
    }

    async getDocument<T>(index: string, id: string): Promise<T | null> {
        try {
            const response = await this.client.get<T>({
                index,
                id,
            })
            return response._source ?? null
        } catch {
            return null
        }
    }

    async updateDocument<T>(
        index: string,
        id: string,
        document: Partial<T>,
    ): Promise<UpdateResponse> {
        return await this.client.update({
            index,
            id,
            doc: document,
        })
    }

    async deleteDocument(index: string, id: string): Promise<DeleteResponse> {
        return await this.client.delete({
            index,
            id,
        })
    }

    async search<T>(index: string, query: any): Promise<SearchResponse<T>> {
        return await this.client.search({
            index,
            ...query,
        })
    }
}
