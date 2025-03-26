import { ElasticsearchService } from '@/modules/infrastructure/elasticsearch/elasticsearch.service'
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Title } from '../../models/title.model'
import { TmdbTitleExtendedResponse } from '../tmdb/types/tmdb.interface'

export interface TitleDocumentES {
    tmdbId: string
    details: TmdbTitleExtendedResponse
}

@Injectable()
export class TitleElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(TitleElasticsearchService.name)
    private readonly indexName = 'titles'

    constructor(private readonly elasticsearchService: ElasticsearchService) {}

    async onModuleInit() {
        await this.createTitleIndex()
    }

    async createTitleIndex() {
        const mappings = {
            properties: {
                tmdbId: { type: 'keyword' },
                details: {
                    properties: {
                        id: { type: 'long' },
                        adult: { type: 'boolean' },
                        backdrop_path: { type: 'keyword' },
                        budget: { type: 'long' },
                        homepage: { type: 'keyword' },
                        imdb_id: { type: 'keyword' },
                        original_language: { type: 'keyword' },
                        original_title: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                        },
                        original_name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                        },
                        overview: { type: 'text' },
                        popularity: { type: 'double' },
                        poster_path: { type: 'keyword' },
                        revenue: { type: 'long' },
                        runtime: { type: 'integer' },
                        status: { type: 'keyword' },
                        tagline: { type: 'text' },
                        title: { type: 'text', analyzer: 'title_analyzer' },
                        name: { type: 'text', analyzer: 'title_analyzer' },
                        video: { type: 'boolean' },
                        vote_average: { type: 'double' },
                        vote_count: { type: 'long' },

                        release_date: {
                            type: 'date',
                            format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                            null_value: null,
                        },
                        first_air_date: {
                            type: 'date',
                            format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                            null_value: null,
                        },

                        genres: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                name: { type: 'keyword' },
                            },
                        },
                        production_companies: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                name: { type: 'keyword' },
                                logo_path: { type: 'keyword' },
                                origin_country: { type: 'keyword' },
                            },
                        },
                        production_countries: {
                            type: 'nested',
                            properties: {
                                iso_3166_1: { type: 'keyword' },
                                name: { type: 'keyword' },
                            },
                        },
                        spoken_languages: {
                            type: 'nested',
                            properties: {
                                iso_639_1: { type: 'keyword' },
                                name: { type: 'keyword' },
                                english_name: { type: 'keyword' },
                            },
                        },

                        credits: {
                            properties: {
                                cast: {
                                    type: 'nested',
                                    properties: {
                                        id: { type: 'long' },
                                        name: { type: 'text' },
                                        character: { type: 'text' },
                                        order: { type: 'integer' },
                                        profile_path: { type: 'keyword' },
                                    },
                                },
                                crew: {
                                    type: 'nested',
                                    properties: {
                                        id: { type: 'long' },
                                        name: { type: 'text' },
                                        job: { type: 'keyword' },
                                        department: { type: 'keyword' },
                                        profile_path: { type: 'keyword' },
                                    },
                                },
                            },
                        },
                        keywords: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                name: { type: 'keyword' },
                            },
                        },
                        images: {
                            properties: {
                                backdrops: {
                                    type: 'nested',
                                    properties: {
                                        aspect_ratio: { type: 'double' },
                                        file_path: { type: 'keyword' },
                                        height: { type: 'integer' },
                                        width: { type: 'integer' },
                                        vote_average: { type: 'double' },
                                        vote_count: { type: 'integer' },
                                    },
                                },
                                posters: {
                                    type: 'nested',
                                    properties: {
                                        aspect_ratio: { type: 'double' },
                                        file_path: { type: 'keyword' },
                                        height: { type: 'integer' },
                                        width: { type: 'integer' },
                                        vote_average: { type: 'double' },
                                        vote_count: { type: 'integer' },
                                    },
                                },
                                logos: {
                                    type: 'nested',
                                    properties: {
                                        aspect_ratio: { type: 'double' },
                                        file_path: { type: 'keyword' },
                                        height: { type: 'integer' },
                                        width: { type: 'integer' },
                                        vote_average: { type: 'double' },
                                        vote_count: { type: 'integer' },
                                    },
                                },
                            },
                        },
                        external_ids: {
                            properties: {
                                imdb_id: { type: 'keyword' },
                                tvdb_id: { type: 'long' },
                                facebook_id: { type: 'keyword' },
                                instagram_id: { type: 'keyword' },
                                twitter_id: { type: 'keyword' },
                                wikidata_id: { type: 'keyword' },
                            },
                        },
                        alternative_titles: {
                            properties: {
                                titles: {
                                    type: 'nested',
                                    properties: {
                                        iso_3166_1: { type: 'keyword' },
                                        title: { type: 'text' },
                                        type: { type: 'keyword' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

        const settings = {
            analysis: {
                analyzer: {
                    title_analyzer: {
                        type: 'custom',
                        tokenizer: 'standard',
                        filter: ['lowercase', 'asciifolding'],
                    },
                },
            },
            index: {
                number_of_shards: 1,
                number_of_replicas: 0,
                refresh_interval: '5s',
            },
        }

        try {
            await this.elasticsearchService.createIndex(
                this.indexName,
                settings,
                mappings,
            )
            this.logger.log(`Index ${this.indexName} created or already exists`)
        } catch (error) {
            this.logger.error(`Failed to create index ${this.indexName}`, error)
        }
    }

    async indexTitle(titleId: string, titleData: TitleDocumentES) {
        try {
            await this.elasticsearchService.indexDocument(
                this.indexName,
                titleId,
                titleData,
            )
            this.logger.log(`Indexed title ${titleId}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to index title ${titleId}`, error)
            return false
        }
    }

    async updateTitle(titleId: string, titleData: Partial<TitleDocumentES>) {
        try {
            await this.elasticsearchService.updateDocument(
                this.indexName,
                titleId,
                titleData,
            )
            this.logger.log(`Updated title ${titleId}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to update title ${titleId}`, error)
            return false
        }
    }

    async getTitle(titleId: string): Promise<TitleDocumentES | null> {
        return this.elasticsearchService.getDocument<TitleDocumentES>(
            this.indexName,
            titleId,
        )
    }

    async deleteTitle(titleId: string): Promise<boolean> {
        try {
            await this.elasticsearchService.deleteDocument(
                this.indexName,
                titleId,
            )
            this.logger.log(`Deleted title ${titleId}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to delete title ${titleId}`, error)
            return false
        }
    }

    async searchTitles(query: any): Promise<SearchResponse<Title>> {
        return await this.elasticsearchService.search<Title>(
            this.indexName,
            query,
        )
    }

    async bulkIndexTitles(items: Array<{ id: string; data: TitleDocumentES }>) {
        try {
            await this.elasticsearchService.bulkIndex(this.indexName, items)
            this.logger.log(`Bulk indexed ${items.length} titles`)
            return true
        } catch (error) {
            this.logger.error(`Failed to bulk index titles`, error)
            return false
        }
    }

    async recreateTitleIndex() {
        try {
            await this.elasticsearchService.deleteIndex(this.indexName)
            this.logger.log(`Index ${this.indexName} deleted`)

            await this.createTitleIndex()
            this.logger.log(`Index ${this.indexName} recreated`)
        } catch (error) {
            this.logger.error(
                `Failed to recreate index ${this.indexName}`,
                error,
            )
            throw error
        }
    }
}
