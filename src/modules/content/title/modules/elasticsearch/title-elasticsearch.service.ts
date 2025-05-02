import { ElasticsearchService } from '@/modules/infrastructure/elasticsearch/elasticsearch.service'
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { TmdbTitleExtendedResponse } from '../../modules/tmdb/types/tmdb.interface'
import { TitleDocumentES } from './types/title-elasticsearch-document.interface'

@Injectable()
export class TitleElasticsearchService implements OnModuleInit {
    private readonly logger = new Logger(TitleElasticsearchService.name)
    private readonly indexName = 'titles'
    private readonly indexSettings = {
        analysis: {
            filter: {
                russian_stop: {
                    type: 'stop',
                    stopwords: '_russian_',
                },
                russian_stemmer: {
                    type: 'stemmer',
                    language: 'russian',
                },
                english_stop: {
                    type: 'stop',
                    stopwords: '_english_',
                },
                english_stemmer: {
                    type: 'stemmer',
                    language: 'english',
                },
                edge_ngram_filter: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20,
                },
            },
            analyzer: {
                title_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding'],
                },
                russian_analyzer: {
                    tokenizer: 'standard',
                    filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
                },
                english_analyzer: {
                    tokenizer: 'standard',
                    filter: ['lowercase', 'english_stop', 'english_stemmer'],
                },
                autocomplete_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
                },
            },
        },
        index: {
            number_of_shards: 1,
            number_of_replicas: 0,
            refresh_interval: '5s',
            max_ngram_diff: 18,
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

    async titleExists(titleId: string): Promise<boolean> {
        try {
            return await this.elasticsearchService.documentExists(
                this.indexName,
                titleId,
            )
        } catch (error) {
            this.logger.error(
                `Check existence failed for ${titleId}: ${error.message}`,
            )
            return false
        }
    }

    async indexTitle(titleId: string, titleData: TmdbTitleExtendedResponse) {
        const titleDataCopy = JSON.parse(JSON.stringify(titleData))

        const document: TitleDocumentES = {
            titleId,
            details: titleDataCopy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        const keywords = document.details.keywords as any
        if (keywords) {
            if ('keywords' in keywords) {
                keywords.results = keywords.keywords
                delete keywords.keywords
            }
        }

        const alternativeTitles = document.details.alternative_titles as any
        if (alternativeTitles) {
            if ('titles' in alternativeTitles) {
                alternativeTitles.results = alternativeTitles.titles
                delete alternativeTitles.titles
            }
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
        const titleDataCopy = JSON.parse(JSON.stringify(titleData))

        if (titleDataCopy.keywords) {
            if ('keywords' in titleDataCopy.keywords) {
                titleDataCopy.keywords.results = titleDataCopy.keywords.keywords
                delete titleDataCopy.keywords.keywords
            }
        }

        if (titleDataCopy.alternative_titles) {
            if ('titles' in titleDataCopy.alternative_titles) {
                titleDataCopy.alternative_titles.results =
                    titleDataCopy.alternative_titles.titles
                delete titleDataCopy.alternative_titles.titles
            }
        }

        const updateDoc = {
            details: titleDataCopy,
            updatedAt: Date.now(),
        }

        try {
            const result = await this.elasticsearchService.updateDocument(
                this.indexName,
                titleId,
                updateDoc,
            )

            if (result === null) return false

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
            const result = await this.elasticsearchService.deleteDocument(
                this.indexName,
                titleId,
            )

            if (result === null) return false

            this.logger.log(`Deleted title ${titleId}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to delete title ${titleId}`, error)
            return false
        }
    }

    async searchTitles(query: any): Promise<SearchResponse<TitleDocumentES>> {
        const normalizedQuery = this.normalizeSearchQuery(query)

        return await this.elasticsearchService.search<TitleDocumentES>(
            this.indexName,
            normalizedQuery,
        )
    }

    private normalizeSearchQuery(query: any): any {
        const normalizedQuery = JSON.parse(JSON.stringify(query))

        this.processQueryObject(normalizedQuery)

        return normalizedQuery
    }

    private processQueryObject(obj: any): void {
        if (!obj || typeof obj !== 'object') return

        Object.keys(obj).forEach((key) => {
            if (key === 'path' && typeof obj[key] === 'string') {
                if (obj[key] === 'details.alternative_titles.titles') {
                    obj[key] = 'details.alternative_titles.results'
                }
                if (obj[key] === 'details.keywords.keywords') {
                    obj[key] = 'details.keywords.results'
                }
            }

            if (obj[key] && typeof obj[key] === 'object') {
                this.processQueryObject(obj[key])
            }
        })
    }

    async initializeIndex() {
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

    async recreateTitleIndex(): Promise<boolean> {
        try {
            const exists = await this.elasticsearchService.indexExists(
                this.indexName,
            )

            if (exists) {
                await this.elasticsearchService.deleteIndex(this.indexName)
                this.logger.log(`Index ${this.indexName} deleted successfully`)
            }

            await this.createTitleIndex()
            this.logger.log(`Index ${this.indexName} recreated successfully`)

            return true
        } catch (error) {
            this.logger.error(
                `Failed to recreate index: ${error.message}`,
                error.stack,
            )
            return false
        }
    }

    private getTitleDetailsMapping() {
        return {
            type: 'object',
            properties: {
                id: { type: 'long' },
                type: { type: 'keyword' },
                adult: { type: 'boolean' },
                backdrop_path: { type: 'keyword' },
                created_by: {
                    type: 'nested',
                    include_in_parent: true,
                    properties: {
                        id: { type: 'long' },
                        credit_id: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                        gender: { type: 'integer' },
                        profile_path: { type: 'keyword' },
                        original_name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                    },
                },
                in_production: { type: 'boolean' },
                languages: { type: 'keyword' },
                last_air_date: {
                    type: 'date',
                    format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                    ignore_malformed: true,
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                last_episode_to_air: {
                    type: 'object',
                    properties: {
                        air_date: {
                            type: 'date',
                            format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                            ignore_malformed: true,
                        },
                        episode_number: { type: 'integer' },
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                        order: { type: 'integer' },
                        overview: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                        },
                        production_code: { type: 'keyword' },
                        rating: { type: 'double' },
                        show_id: { type: 'integer' },
                        season_number: { type: 'integer' },
                        still_path: { type: 'keyword' },
                        vote_average: { type: 'double' },
                        vote_count: { type: 'long' },
                        episode_type: { type: 'keyword' },
                        runtime: { type: 'integer' },
                    },
                },
                next_episode_to_air: {
                    type: 'object',
                    properties: {
                        air_date: {
                            type: 'date',
                            format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                            ignore_malformed: true,
                        },
                        episode_number: { type: 'integer' },
                        id: { type: 'long' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                        order: { type: 'integer' },
                        overview: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                        },
                        production_code: { type: 'keyword' },
                        rating: { type: 'double' },
                        show_id: { type: 'integer' },
                        season_number: { type: 'integer' },
                        still_path: { type: 'keyword' },
                        vote_average: { type: 'double' },
                        vote_count: { type: 'long' },
                        episode_type: { type: 'keyword' },
                        runtime: { type: 'integer' },
                    },
                },
                number_of_episodes: { type: 'integer' },
                number_of_seasons: { type: 'integer' },
                seasons: {
                    type: 'nested',
                    properties: {
                        air_date: {
                            type: 'date',
                            format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                            ignore_malformed: true,
                        },
                        episode_count: { type: 'integer' },
                        id: { type: 'long' },
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
                        poster_path: { type: 'keyword' },
                        season_number: { type: 'integer' },
                        vote_average: { type: 'double' },
                    },
                },
                budget: { type: 'long' },
                homepage: { type: 'keyword' },
                imdb_id: { type: 'keyword' },
                original_language: { type: 'keyword' },
                original_title: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                        russian: { type: 'text', analyzer: 'russian_analyzer' },
                        english: { type: 'text', analyzer: 'english_analyzer' },
                        autocomplete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                        },
                    },
                },
                original_name: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                        russian: { type: 'text', analyzer: 'russian_analyzer' },
                        english: { type: 'text', analyzer: 'english_analyzer' },
                        autocomplete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                        },
                    },
                },
                filming_locations: {
                    type: 'nested',
                    properties: {
                        id: { type: 'keyword' },
                        placeId: { type: 'keyword' },
                        address: { type: 'text', analyzer: 'standard' },
                        formattedAddress: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                        city: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                keyword: { type: 'keyword', ignore_above: 256 },
                            },
                        },
                        state: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                keyword: { type: 'keyword', ignore_above: 256 },
                            },
                        },
                        countryId: { type: 'keyword' },
                        countryCode: { type: 'keyword' },
                        countryName: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                keyword: { type: 'keyword', ignore_above: 256 },
                            },
                        },
                        coordinates: { type: 'geo_point' },
                        description: { type: 'text', analyzer: 'standard' },
                        descriptions: {
                            type: 'object',
                            properties: {
                                en: {
                                    type: 'text',
                                    analyzer: 'english_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                        autocomplete: {
                                            type: 'text',
                                            analyzer: 'autocomplete_analyzer',
                                        },
                                    },
                                },
                                ru: {
                                    type: 'text',
                                    analyzer: 'russian_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                        autocomplete: {
                                            type: 'text',
                                            analyzer: 'autocomplete_analyzer',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                overview: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                        russian: { type: 'text', analyzer: 'russian_analyzer' },
                        english: { type: 'text', analyzer: 'english_analyzer' },
                        autocomplete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                        },
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
                        russian: { type: 'text', analyzer: 'russian_analyzer' },
                        english: { type: 'text', analyzer: 'english_analyzer' },
                        autocomplete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                        },
                    },
                },
                name: {
                    type: 'text',
                    analyzer: 'title_analyzer',
                    fields: {
                        keyword: { type: 'keyword' },
                        russian: { type: 'text', analyzer: 'russian_analyzer' },
                        english: { type: 'text', analyzer: 'english_analyzer' },
                        autocomplete: {
                            type: 'text',
                            analyzer: 'autocomplete_analyzer',
                        },
                    },
                },
                video: { type: 'boolean' },
                vote_average: { type: 'double' },
                vote_count: { type: 'long' },
                release_date: {
                    type: 'date',
                    format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                    ignore_malformed: true,
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                first_air_date: {
                    type: 'date',
                    format: 'yyyy-MM-dd||yyyy-MM||yyyy',
                    ignore_malformed: true,
                    fields: {
                        keyword: { type: 'keyword' },
                    },
                },
                genres: {
                    type: 'nested',
                    include_in_parent: true,
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
                    include_in_parent: true,
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
                    include_in_parent: true,
                    properties: {
                        iso_3166_1: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                    },
                },
                spoken_languages: {
                    type: 'nested',
                    include_in_parent: true,
                    properties: {
                        iso_639_1: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                        english_name: {
                            type: 'text',
                            analyzer: 'title_analyzer',
                            fields: {
                                keyword: { type: 'keyword' },
                            },
                        },
                    },
                },
                credits: {
                    type: 'object',
                    properties: {
                        cast: {
                            type: 'nested',
                            include_in_parent: true,
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
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                character: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
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
                            include_in_parent: true,
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
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                popularity: { type: 'float' },
                                job: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                department: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
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
                        results: {
                            type: 'nested',
                            include_in_parent: true,
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
                            include_in_parent: true,
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                // vote_average: { type: 'double' },
                                vote_average: {
                                    type: 'scaled_float',
                                    scaling_factor: 100,
                                },
                                vote_count: { type: 'integer' },
                                iso_639_1: { type: 'keyword' },
                            },
                        },
                        posters: {
                            type: 'nested',
                            include_in_parent: true,
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                // vote_average: { type: 'double' },
                                vote_average: {
                                    type: 'scaled_float',
                                    scaling_factor: 100,
                                },
                                vote_count: { type: 'integer' },
                                iso_639_1: { type: 'keyword' },
                            },
                        },
                        logos: {
                            type: 'nested',
                            include_in_parent: true,
                            properties: {
                                aspect_ratio: { type: 'double' },
                                file_path: { type: 'keyword' },
                                height: { type: 'integer' },
                                width: { type: 'integer' },
                                // vote_average: { type: 'double' },
                                vote_average: {
                                    type: 'scaled_float',
                                    scaling_factor: 100,
                                },
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
                        freebase_mid: { type: 'keyword' },
                        freebase_id: { type: 'keyword' },
                        tvdb_id: { type: 'long' },
                        tvrage_id: { type: 'keyword' },
                        wikidata_id: { type: 'keyword' },
                        facebook_id: { type: 'keyword' },
                        instagram_id: { type: 'keyword' },
                        twitter_id: { type: 'keyword' },
                    },
                },
                alternative_titles: {
                    type: 'object',
                    properties: {
                        results: {
                            type: 'nested',
                            include_in_parent: true,
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
                            include_in_parent: true,
                            properties: {
                                iso_3166_1: { type: 'keyword' },
                                iso_639_1: { type: 'keyword' },
                                name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
                                english_name: {
                                    type: 'text',
                                    analyzer: 'title_analyzer',
                                    fields: {
                                        keyword: { type: 'keyword' },
                                    },
                                },
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
                                            fields: {
                                                keyword: { type: 'keyword' },
                                            },
                                        },
                                        homepage: { type: 'keyword' },
                                        tagline: {
                                            type: 'text',
                                            analyzer: 'title_analyzer',
                                            fields: {
                                                keyword: { type: 'keyword' },
                                            },
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
                    include_in_parent: true,
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
            },
        }
    }

    async updateTitleWithFilmingLocations(
        titleId: string,
        filmingLocations: any[],
    ): Promise<boolean> {
        try {
            const existingDoc = await this.getTitle(titleId)
            if (!existingDoc) {
                this.logger.warn(
                    `Title ${titleId} not found in Elasticsearch. Cannot update filming locations.`,
                )
                return false
            }

            const updatedDetails = JSON.parse(
                JSON.stringify(existingDoc.details),
            )

            updatedDetails.filming_locations = filmingLocations

            const updateDoc = {
                details: updatedDetails,
                updatedAt: Date.now(),
            }

            const result = await this.elasticsearchService.updateDocument(
                this.indexName,
                titleId,
                updateDoc,
            )

            if (result === null) return false

            this.logger.log(
                `Filming locations for title ${titleId} updated in Elasticsearch`,
            )
            return true
        } catch (error) {
            this.logger.error(
                `Failed to update filming locations for title ${titleId} in Elasticsearch: ${error.message}`,
                error,
            )
            return false
        }
    }
}
