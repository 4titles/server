import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import {
    PaginatedResult,
    SearchOptions,
} from '@/shared/types/pagination.interface'
import { dateReviver } from '@/shared/utils/time/date-retriever.util'
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'
import { Injectable, Logger } from '@nestjs/common'
import { TitleRelationsConfigService } from '../config/title-relations.config'
import { TitleGeosearchInput } from '../inputs/title-geosearch.input'
import { TitleSearchInput } from '../inputs/title-search.input'
import { TitleFilmingLocation } from '../models/title-filming-location.model'
import { Title } from '../models/title.model'
import { TitleElasticsearchService } from '../modules/elasticsearch/title-elasticsearch.service'
import { TitleDocumentES } from '../modules/elasticsearch/types/title-elasticsearch-document.interface'
import { TitleQueryService } from './title-query.service'
import { TitleService } from './title.service'

@Injectable()
export class TitleSearchService {
    private readonly logger = new Logger(TitleSearchService.name)
    private readonly CACHE_KEY_PREFIX = 'title:search:'
    private readonly CACHE_TTL_SECONDS = 60 * 30 // 30 min
    private readonly cacheDateKeys: string[] = []

    constructor(
        private readonly titleQueryService: TitleQueryService,
        private readonly titleService: TitleService,
        private readonly cacheService: CacheService,
        private readonly titleElasticsearchService: TitleElasticsearchService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
    ) {
        this.cacheDateKeys = titleQueryService.getCacheTitleDateKeys()
    }

    async searchTitles(
        input: TitleSearchInput,
    ): Promise<PaginatedResult<Title>> {
        const { query, options } = input

        this.logger.debug(`Searching titles with query: ${query}`)

        const cacheKey = this.getSearchCacheKey(query, options)

        try {
            const cachedResult = await this.cacheService.get<string>(cacheKey)
            if (cachedResult) {
                this.logger.debug(`Cache hit for search query: ${query}`)
                const result = JSON.parse(cachedResult, (key, value) =>
                    dateReviver(this.cacheDateKeys, key, value),
                )
                return result as PaginatedResult<Title>
            }

            this.logger.debug(`Cache miss for search query: ${query}`)

            const esResult = await this.performElasticsearchSearch(
                query,
                options,
            )
            const enrichedResult = await this.enrichSearchResults(esResult)

            if (enrichedResult.items.length > 0) {
                const firstTitle = enrichedResult.items[0]
                const { id, slug } = firstTitle

                try {
                    await this.titleQueryService.trackTitleSearch(id, slug)
                } catch (error) {
                    this.logger.error(`Error tracking popular title: ${error}`)
                }
            }

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(enrichedResult),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(`Search results for "${query}" saved to cache.`)

            return enrichedResult
        } catch (error) {
            this.logger.error(
                `Error during title search for "${query}":`,
                error,
            )
            throw error
        }
    }

    async searchTitlesByLocationText(
        input: TitleSearchInput,
    ): Promise<PaginatedResult<Title>> {
        const { query, options } = input

        this.logger.debug(`Searching titles by location text query: ${query}`)

        const cacheKey = this.getLocationSearchCacheKey(query, options)

        try {
            const cachedResult = await this.cacheService.get<string>(cacheKey)
            if (cachedResult) {
                this.logger.debug(
                    `Cache hit for location search query: ${query}`,
                )
                const result = JSON.parse(cachedResult, (key, value) =>
                    dateReviver(this.cacheDateKeys, key, value),
                )
                return result as PaginatedResult<Title>
            }

            this.logger.debug(`Cache miss for location search query: ${query}`)

            const from = options.from || 0
            const size = options.size || 10

            const esQuery = {
                from,
                size,
                query: {
                    nested: {
                        path: 'details.filming_locations',
                        query: {
                            multi_match: {
                                query,
                                fields: [
                                    'details.filming_locations.address',
                                    'details.filming_locations.formattedAddress',
                                    'details.filming_locations.city',
                                    'details.filming_locations.state',
                                    'details.filming_locations.countryName',
                                    'details.filming_locations.description',
                                    'details.filming_locations.enhancedDescription',
                                ],
                                fuzziness: 'AUTO',
                            },
                        },
                    },
                },
            }

            const response =
                await this.titleElasticsearchService.searchTitles(esQuery)
            const paginatedResult =
                this.mapSearchResponseToPaginatedResult<TitleDocumentES>(
                    response,
                    options,
                )
            const enrichedResult =
                await this.enrichSearchResults(paginatedResult)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(enrichedResult),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(
                `Location search results for "${query}" saved to cache.`,
            )

            return enrichedResult
        } catch (error) {
            this.logger.error(
                `Error during location text search for "${query}":`,
                error,
            )
            throw error
        }
    }

    async searchTitlesByCoordinates(
        input: TitleGeosearchInput,
    ): Promise<PaginatedResult<Title>> {
        const { lat, lon, distance, options } = input

        this.logger.debug(
            `Searching titles by coordinates: lat=${lat}, lon=${lon}, distance=${distance}`,
        )

        const cacheKey = this.getCoordinateSearchCacheKey(
            lat,
            lon,
            distance,
            options,
        )

        try {
            const cachedResult = await this.cacheService.get<string>(cacheKey)
            if (cachedResult) {
                this.logger.debug(
                    `Cache hit for coordinates search: lat=${lat}, lon=${lon}`,
                )
                const result = JSON.parse(cachedResult, (key, value) =>
                    dateReviver(this.cacheDateKeys, key, value),
                )
                return result as PaginatedResult<Title>
            }

            this.logger.debug(
                `Cache miss for coordinates search: lat=${lat}, lon=${lon}`,
            )

            const from = options.from || 0
            const size = options.size || 10

            const esQuery = {
                from,
                size,
                query: {
                    nested: {
                        path: 'details.filming_locations',
                        query: {
                            geo_distance: {
                                distance,
                                'details.filming_locations.coordinates': {
                                    lat,
                                    lon,
                                },
                            },
                        },
                    },
                },
                sort: [
                    {
                        _geo_distance: {
                            'details.filming_locations.coordinates': {
                                lat,
                                lon,
                            },
                            order: 'asc',
                            unit: 'km',
                            mode: 'min',
                            distance_type: 'arc',
                            ignore_unmapped: true,
                            nested: {
                                path: 'details.filming_locations',
                            },
                        },
                    },
                ],
            }

            const response =
                await this.titleElasticsearchService.searchTitles(esQuery)
            const paginatedResult =
                this.mapSearchResponseToPaginatedResult<TitleDocumentES>(
                    response,
                    options,
                )
            const enrichedResult =
                await this.enrichSearchResults(paginatedResult)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(enrichedResult),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(`Coordinate search results saved to cache.`)

            return enrichedResult
        } catch (error) {
            this.logger.error(`Error during coordinates search:`, error)
            throw error
        }
    }

    async searchTitleFilmingLocations(
        titleId: string,
        query: string,
    ): Promise<TitleFilmingLocation[]> {
        this.logger.debug(
            `Searching filming locations in title ${titleId} with query: ${query}`,
        )

        const cacheKey = `${this.CACHE_KEY_PREFIX}locations:title:${titleId}:${query}`

        try {
            const cachedResult = await this.cacheService.get<string>(cacheKey)
            if (cachedResult) {
                this.logger.debug(
                    `Cache hit for filming locations search in title ${titleId} with query: ${query}`,
                )
                const result = JSON.parse(cachedResult, (key, value) =>
                    dateReviver(this.cacheDateKeys, key, value),
                )
                return result as TitleFilmingLocation[]
            }

            this.logger.debug(
                `Cache miss for filming locations search in title ${titleId} with query: ${query}`,
            )

            const dbTitle = await this.titleService.findById(titleId, {
                customRelations: this.titleRelationsConfig.FULL,
            })

            if (!dbTitle) {
                this.logger.warn(`Title with ID ${titleId} not found`)
                return []
            }

            if (!query || query.trim() === '') {
                const title = await this.titleQueryService.getTitleById(titleId)
                return title.filmingLocations || []
            }

            const esQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { titleId } },
                            {
                                nested: {
                                    path: 'details.filming_locations',
                                    query: {
                                        bool: {
                                            should: [
                                                {
                                                    multi_match: {
                                                        query,
                                                        fields: [
                                                            'details.filming_locations.address',
                                                            'details.filming_locations.formattedAddress',
                                                            'details.filming_locations.city',
                                                            'details.filming_locations.state',
                                                            'details.filming_locations.countryName',
                                                            'details.filming_locations.description',
                                                            'details.filming_locations.descriptions.en',
                                                            'details.filming_locations.descriptions.ru',
                                                        ],
                                                        fuzziness: 'AUTO',
                                                    },
                                                },
                                            ],
                                            minimum_should_match: 1,
                                        },
                                    },
                                    inner_hits: {
                                        _source: true,
                                        highlight: {
                                            fields: {
                                                'details.filming_locations.address':
                                                    {},
                                                'details.filming_locations.description':
                                                    {},
                                                'details.filming_locations.descriptions.en':
                                                    {},
                                                'details.filming_locations.descriptions.ru':
                                                    {},
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            }

            const response =
                await this.titleElasticsearchService.searchTitles(esQuery)

            const filmingLocations: TitleFilmingLocation[] = []

            if (
                response.hits.total &&
                (typeof response.hits.total === 'number'
                    ? response.hits.total
                    : response.hits.total.value) > 0
            ) {
                const hit = response.hits.hits[0]

                if (
                    hit &&
                    hit.inner_hits &&
                    hit.inner_hits['details.filming_locations'] &&
                    hit.inner_hits['details.filming_locations'].hits.total
                ) {
                    const innerHits =
                        hit.inner_hits['details.filming_locations'].hits.hits
                    const locationIds = new Set<string>()

                    for (const innerHit of innerHits) {
                        const locationSource = innerHit._source as any
                        if (locationSource && locationSource.id) {
                            locationIds.add(locationSource.id)
                        }
                    }

                    if (locationIds.size > 0) {
                        const title =
                            await this.titleQueryService.getTitleById(titleId)

                        if (
                            title.filmingLocations &&
                            title.filmingLocations.length > 0
                        ) {
                            for (const location of title.filmingLocations) {
                                if (
                                    location.filmingLocation &&
                                    locationIds.has(location.filmingLocation.id)
                                ) {
                                    filmingLocations.push(location)
                                }
                            }
                        }
                    }
                }
            }

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(filmingLocations),
                this.CACHE_TTL_SECONDS / 2,
            )

            this.logger.debug(
                `Found ${filmingLocations.length} filming locations for title ${titleId} with query: ${query}`,
            )
            return filmingLocations
        } catch (error) {
            this.logger.error(
                `Error searching filming locations in title ${titleId}:`,
                error,
            )
            return []
        }
    }

    async searchFilmingLocationsByIds(
        locationIds: string[],
        query?: string,
    ): Promise<TitleFilmingLocation[]> {
        if (!locationIds || locationIds.length === 0) {
            this.logger.warn('No location IDs provided for search')
            return []
        }

        this.logger.debug(
            `Searching filming locations by IDs: [${locationIds.join(', ')}] with query: ${query || 'none'}`,
        )

        const cacheKey = `${this.CACHE_KEY_PREFIX}locations:ids:${locationIds.join('_')}:${query || ''}`

        try {
            const cachedResult = await this.cacheService.get<string>(cacheKey)
            if (cachedResult) {
                this.logger.debug(
                    `Cache hit for filming locations search by IDs with query: ${query || 'none'}`,
                )
                const result = JSON.parse(cachedResult, (key, value) =>
                    dateReviver(this.cacheDateKeys, key, value),
                )
                return result
            }

            this.logger.debug(
                `Cache miss for filming locations search by IDs with query: ${query || 'none'}`,
            )

            const mustClauses: any[] = [
                {
                    nested: {
                        path: 'details.filming_locations',
                        query: {
                            terms: {
                                'details.filming_locations.id': locationIds,
                            },
                        },
                    },
                },
            ]

            if (query && query.trim() !== '') {
                mustClauses.push({
                    nested: {
                        path: 'details.filming_locations',
                        query: {
                            bool: {
                                must: [
                                    {
                                        terms: {
                                            'details.filming_locations.id':
                                                locationIds,
                                        },
                                    },
                                    {
                                        multi_match: {
                                            query,
                                            fields: [
                                                'details.filming_locations.address',
                                                'details.filming_locations.formattedAddress',
                                                'details.filming_locations.city',
                                                'details.filming_locations.state',
                                                'details.filming_locations.countryName',
                                                'details.filming_locations.description',
                                                'details.filming_locations.enhancedDescription',
                                                'details.filming_locations.descriptions.en',
                                                'details.filming_locations.descriptions.ru',
                                            ],
                                            fuzziness: 'AUTO',
                                        },
                                    },
                                ],
                            },
                        },
                        inner_hits: {
                            _source: true,
                            highlight: {
                                fields: {
                                    'details.filming_locations.address': {},
                                    'details.filming_locations.description': {},
                                    'details.filming_locations.descriptions.en':
                                        {},
                                    'details.filming_locations.descriptions.ru':
                                        {},
                                },
                            },
                        },
                    },
                })
            }

            const esQuery = {
                query: {
                    bool: {
                        must: mustClauses,
                    },
                },
            }

            const response =
                await this.titleElasticsearchService.searchTitles(esQuery)

            const filmingLocations: TitleFilmingLocation[] = []
            const processedTitleIds = new Set<string>()

            if (
                response.hits.total &&
                (typeof response.hits.total === 'number'
                    ? response.hits.total
                    : response.hits.total.value) > 0
            ) {
                const titleIds = response.hits.hits
                    .map((hit) => (hit._source as any).titleId)
                    .filter((id) => !!id)

                for (const titleId of titleIds) {
                    if (processedTitleIds.has(titleId)) continue
                    processedTitleIds.add(titleId)

                    try {
                        const title =
                            await this.titleQueryService.getTitleById(titleId)

                        if (
                            title.filmingLocations &&
                            title.filmingLocations.length > 0
                        ) {
                            const matchingLocations =
                                title.filmingLocations.filter(
                                    (loc) =>
                                        loc.filmingLocation &&
                                        locationIds.includes(
                                            loc.filmingLocation.id,
                                        ),
                                )

                            if (query && query.trim() !== '') {
                                const matchedLocationIds = new Set<string>()

                                for (const hit of response.hits.hits) {
                                    if (
                                        hit.inner_hits &&
                                        hit.inner_hits[
                                            'details.filming_locations'
                                        ]
                                    ) {
                                        const innerHits =
                                            hit.inner_hits[
                                                'details.filming_locations'
                                            ].hits.hits

                                        for (const innerHit of innerHits) {
                                            const locationSource =
                                                innerHit._source as any
                                            if (
                                                locationSource &&
                                                locationSource.id
                                            ) {
                                                matchedLocationIds.add(
                                                    locationSource.id,
                                                )
                                            }
                                        }
                                    }
                                }

                                const textFilteredLocations =
                                    matchingLocations.filter(
                                        (loc) =>
                                            loc.filmingLocation &&
                                            matchedLocationIds.has(
                                                loc.filmingLocation.id,
                                            ),
                                    )

                                filmingLocations.push(...textFilteredLocations)
                            } else {
                                filmingLocations.push(...matchingLocations)
                            }
                        }
                    } catch (error) {
                        this.logger.error(
                            `Error getting title data for ID ${titleId}:`,
                            error,
                        )
                    }
                }
            }

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(filmingLocations),
                this.CACHE_TTL_SECONDS / 2,
            )

            this.logger.debug(
                `Found ${filmingLocations.length} filming locations for IDs [${locationIds.join(', ')}] with query: ${query || 'none'}`,
            )
            return filmingLocations
        } catch (error) {
            this.logger.error(
                `Error searching filming locations by IDs:`,
                error,
            )
            return []
        }
    }

    private async performElasticsearchSearch(
        query: string,
        options: SearchOptions,
    ): Promise<PaginatedResult<TitleDocumentES>> {
        const from = options.from || 0
        const size = options.size || 10

        const esQuery = {
            from,
            size,
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query,
                                fields: [
                                    'details.title',
                                    'details.name',
                                    'details.original_title',
                                    'details.original_name',
                                    'details.overview',
                                    'details.tagline',
                                ],
                                fuzziness: 'AUTO',
                            },
                        },
                        // translations
                        {
                            nested: {
                                path: 'details.translations.translations',
                                query: {
                                    multi_match: {
                                        query,
                                        fields: [
                                            'details.translations.translations.title',
                                            'details.translations.translations.overview',
                                            'details.translations.translations.tagline',
                                        ],
                                        fuzziness: 'AUTO',
                                    },
                                },
                            },
                        },
                        // alternative titles
                        {
                            nested: {
                                path: 'details.alternative_titles.titles',
                                query: {
                                    match: {
                                        'details.alternative_titles.titles.title':
                                            {
                                                query,
                                                fuzziness: 'AUTO',
                                            },
                                    },
                                },
                            },
                        },
                        // keywords
                        {
                            nested: {
                                path: 'details.keywords.keywords',
                                query: {
                                    match: {
                                        'details.keywords.keywords.name': {
                                            query,
                                            fuzziness: 'AUTO',
                                        },
                                    },
                                },
                            },
                        },
                        // credits (cast & crew)
                        {
                            nested: {
                                path: 'details.credits.cast',
                                query: {
                                    multi_match: {
                                        query,
                                        fields: [
                                            'details.credits.cast.name',
                                            'details.credits.cast.character',
                                        ],
                                        fuzziness: 'AUTO',
                                    },
                                },
                            },
                        },
                        {
                            nested: {
                                path: 'details.credits.crew',
                                query: {
                                    match: {
                                        'details.credits.crew.name': {
                                            query,
                                            fuzziness: 'AUTO',
                                        },
                                    },
                                },
                            },
                        },
                        // filming locations
                        {
                            nested: {
                                path: 'details.filming_locations',
                                query: {
                                    multi_match: {
                                        query,
                                        fields: [
                                            'details.filming_locations.address',
                                            'details.filming_locations.formattedAddress',
                                            'details.filming_locations.city',
                                            'details.filming_locations.state',
                                            'details.filming_locations.countryName',
                                            'details.filming_locations.description',
                                            'details.filming_locations.enhancedDescription',
                                        ],
                                        fuzziness: 'AUTO',
                                    },
                                },
                            },
                        },
                    ],
                    minimum_should_match: 1,
                },
            },
        }

        const response =
            await this.titleElasticsearchService.searchTitles(esQuery)
        return this.mapSearchResponseToPaginatedResult<TitleDocumentES>(
            response,
            options,
        )
    }

    private async enrichSearchResults(
        results: PaginatedResult<TitleDocumentES>,
    ): Promise<PaginatedResult<Title>> {
        if (results.items.length === 0) {
            return {
                ...results,
                items: [],
            }
        }

        const titleIds = results.items.map((item) => item.titleId)
        const titles = await this.titleService.findManyByIds(titleIds, {
            customRelations: this.titleRelationsConfig.FULL,
        })

        const titleMap = new Map()
        for (const title of titles) {
            titleMap.set(title.id, title)
        }

        const enrichedItems = await Promise.all(
            results.items.map(async (item) => {
                const dbTitle = titleMap.get(item.titleId)
                if (!dbTitle) {
                    this.logger.warn(
                        `Title with ID ${item.titleId} found in Elasticsearch but not in DB`,
                    )
                    return null
                }

                return this.titleQueryService.combineDbAndEsTitleData(
                    dbTitle,
                    item.details
                        ? {
                              titleId: item.titleId,
                              details: item.details,
                          }
                        : null,
                )
            }),
        )

        return {
            ...results,
            items: enrichedItems.filter((item) => item !== null),
        }
    }

    private mapSearchResponseToPaginatedResult<T = TitleDocumentES>(
        response: SearchResponse<T>,
        options: SearchOptions,
    ): PaginatedResult<T> {
        const hits = response.hits.hits.map((hit) => hit._source) as T[]
        const total =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total.value
        const from = options.from || 0
        const size = options.size || 10

        return {
            items: hits,
            total,
            hasNextPage: from + size < total,
            hasPreviousPage: from > 0,
        }
    }

    private getSearchCacheKey(query: string, options: SearchOptions): string {
        return `${this.CACHE_KEY_PREFIX}${query}:${options.from || 0}:${options.size || 10}`
    }

    private getLocationSearchCacheKey(
        query: string,
        options: SearchOptions,
    ): string {
        return `${this.CACHE_KEY_PREFIX}location:${query}:${options.from || 0}:${options.size || 10}`
    }

    private getCoordinateSearchCacheKey(
        lat: number,
        lon: number,
        distance: string,
        options: SearchOptions,
    ): string {
        return `${this.CACHE_KEY_PREFIX}coordinates:${lat}:${lon}:${distance}:${options.from || 0}:${options.size || 10}`
    }
}
