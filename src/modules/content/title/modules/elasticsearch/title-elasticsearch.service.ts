import { ElasticsearchService } from '@/modules/infrastructure/elasticsearch/elasticsearch.service'
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Title } from '../../models/title.model'
import { TmdbTitleExtendedResponse } from '../tmdb/types/tmdb.interface'
import { TitleDocumentES } from './types/title-elasticsearch-document.interface'

@Injectable()
export class TitleElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(TitleElasticsearchService.name)
    private readonly indexName = 'titles'
    private readonly indexSettings = {
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
    private readonly indexMappings = {
        dynamic: 'strict' as const,
        properties: {
            titleId: { type: 'keyword' },
            details: this.getTitleDetailsMapping(),
            createdAt: { type: 'date', format: 'epoch_millis' },
            updatedAt: { type: 'date', format: 'epoch_millis' },
        },
    }

    constructor(private readonly elasticsearchService: ElasticsearchService) {}

    async onModuleInit() {
        await this.initializeIndex()
    }

    async createTitleIndex() {
        try {
            await this.elasticsearchService.createIndex(
                this.indexName,
                this.indexSettings,
                this.indexMappings,
            )
        } catch (error) {
            this.logger.error(`Index creation failed: ${error.message}`)
            throw error
        }
    }

    async indexTitle(titleId: string, titleData: TmdbTitleExtendedResponse) {
        const document: TitleDocumentES = {
            titleId,
            details: titleData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        try {
            await this.elasticsearchService.indexDocument(
                this.indexName,
                titleId,
                document,
            )
            this.logger.log(`Title ${titleId} indexed`)
            return true
        } catch (error) {
            this.logger.error(
                `Indexing failed for ${titleId}: ${error.message}`,
            )
            return false
        }
    }

    async updateTitle(
        titleId: string,
        titleData: Partial<TmdbTitleExtendedResponse>,
    ) {
        const updateDoc = {
            details: titleData,
            updatedAt: Date.now(),
        }

        try {
            await this.elasticsearchService.updateDocument(
                this.indexName,
                titleId,
                updateDoc,
            )
            this.logger.log(`Title ${titleId} updated`)
            return true
        } catch (error) {
            this.logger.error(`Update failed for ${titleId}: ${error.message}`)
            return false
        }
    }

    async getTitle(titleId: string): Promise<TitleDocumentES | null> {
        try {
            const doc =
                await this.elasticsearchService.getDocument<TitleDocumentES>(
                    this.indexName,
                    titleId,
                )
            return doc || null
        } catch (error) {
            this.logger.error(`Fetch failed for ${titleId}: ${error.message}`)
            return null
        }
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

    async bulkIndexTitles(items: TitleDocumentES[]) {
        const bulkData = items.map((item) => ({
            id: item.titleId,
            data: {
                titleId: item.titleId,
                tmdbId: item.details.id,
                details: item.details,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        }))

        try {
            await this.elasticsearchService.bulkIndex(this.indexName, bulkData)
            this.logger.log(`Bulk indexed ${items.length} titles`)
            return { success: true, count: items.length }
        } catch (error) {
            this.logger.error(`Bulk indexing failed: ${error.message}`)
            return { success: false, error: error.message }
        }
    }

    private async initializeIndex() {
        try {
            const exists = await this.elasticsearchService.indexExists(
                this.indexName,
            )

            if (!exists) {
                await this.createTitleIndex()
                this.logger.log(`Index ${this.indexName} created successfully`)
            } else {
                this.logger.log(`Index ${this.indexName} already exists`)
            }
        } catch (error) {
            this.logger.error(`Index initialization failed: ${error.message}`)
            throw error
        }
    }

    private getTitleDetailsMapping() {
        return {
            type: 'object',
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
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                original_name: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                overview: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                popularity: { type: 'double' },
                poster_path: { type: 'keyword' },
                revenue: { type: 'long' },
                runtime: { type: 'integer' },
                status: { type: 'keyword' },
                tagline: { type: 'text' },
                title: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                name: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                video: { type: 'boolean' },
                vote_average: { type: 'double' },
                vote_count: { type: 'long' },
                release_date: {
                    type: 'date',
                    format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                    ignore_malformed: true,
                },
                first_air_date: {
                    type: 'date',
                    format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                    ignore_malformed: true,
                },
                genres: {
                    type: 'nested',
                    properties: {
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                    },
                },
                production_companies: {
                    type: 'nested',
                    properties: {
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
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
                    type: 'object',
                    properties: {
                        cast: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                adult: { type: 'boolean' },
                                name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                original_name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                },
                                character: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                },
                                order: { type: 'integer' },
                                profile_path: { type: 'keyword' },
                                known_for_department: { type: 'keyword' },
                                popularity: { type: 'float' },
                                cast_id: { type: 'integer' },
                                credit_id: { type: 'keyword' },
                                gender: { type: 'integer' },
                            },
                        },
                        crew: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                adult: { type: 'boolean' },
                                name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                original_name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                },
                                popularity: { type: 'float' },
                                job: { type: 'keyword' },
                                department: { type: 'keyword' },
                                profile_path: { type: 'keyword' },
                                known_for_department: { type: 'keyword' },
                                gender: { type: 'integer' },
                                credit_id: { type: 'keyword' },
                            },
                        },
                    },
                },
                keywords: {
                    type: 'object',
                    properties: {
                        keywords: {
                            type: 'nested',
                            properties: {
                                id: { type: 'long' },
                                name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                            },
                        },
                    },
                },
                belongs_to_collection: {
                    type: 'object',
                    properties: {
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                        poster_path: { type: 'keyword' },
                        backdrop_path: { type: 'keyword' },
                    },
                },
                images: {
                    type: 'object',
                    properties: {
                        backdrops: {
                            type: 'nested',
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                vote_average: { type: 'float' },
                                vote_count: { type: 'integer' },
                                iso_639_1: { type: 'keyword' },
                            },
                        },
                        posters: {
                            type: 'nested',
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                vote_average: { type: 'float' },
                                vote_count: { type: 'integer' },
                                iso_639_1: { type: 'keyword' },
                            },
                        },
                        logos: {
                            type: 'nested',
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                vote_average: { type: 'float' },
                                vote_count: { type: 'integer' },
                                iso_639_1: { type: 'keyword' },
                            },
                        },
                    },
                },
                external_ids: {
                    type: 'object',
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
                    type: 'object',
                    properties: {
                        titles: {
                            type: 'nested',
                            properties: {
                                iso_3166_1: { type: 'keyword' },
                                title: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                type: { type: 'keyword' },
                            },
                        },
                    },
                },
                translations: {
                    type: 'object',
                    properties: {
                        translations: {
                            type: 'nested',
                            properties: {
                                iso_3166_1: { type: 'keyword' },
                                iso_639_1: { type: 'keyword' },
                                name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                },
                                english_name: { type: 'keyword' },
                                data: {
                                    type: 'object',
                                    properties: {
                                        title: {
                                            type: 'text',
                                            analyzer: 'title_analyzer',
                                            fields: {
                                                keyword: { type: 'keyword' },
                                            },
                                        },
                                        name: {
                                            type: 'text',
                                            analyzer: 'title_analyzer',
                                            fields: {
                                                keyword: { type: 'keyword' },
                                            },
                                        },
                                        overview: {
                                            type: 'text',
                                            analyzer: 'title_analyzer',
                                        },
                                        homepage: { type: 'keyword' },
                                        tagline: {
                                            type: 'text',
                                            analyzer: 'title_analyzer',
                                        },
                                        runtime: { type: 'integer' },
                                    },
                                },
                            },
                        },
                    },
                },
                origin_country: { type: 'keyword' },
                episode_run_time: { type: 'integer' },
                networks: {
                    type: 'nested',
                    properties: {
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                    },
                },
            },
        }
    }
}
