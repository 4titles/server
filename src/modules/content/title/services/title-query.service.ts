import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbPopularTitle,
    DbPopularTitleInsert,
    popularTitles,
} from '@/modules/infrastructure/drizzle/schema/popular-titles.schema'
import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { dateReviver } from '@/shared/utils/time/date-retriever.util'
import {
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common'
import { desc, eq, sql } from 'drizzle-orm'
import { TitleRelationsConfigService } from '../config/title-relations.config'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import { TitleFilterInput } from '../inputs/title-filter.input'
import { TitleSearchOptionsInput } from '../inputs/title-search-options.input'
import { TitleSearchInput } from '../inputs/title-search.input'
import { Title } from '../models/title.model'
import { TitleDocumentES } from '../modules/elasticsearch/types/title-elasticsearch-document.interface'
import { TitleElasticsearchSyncService } from './sync/title-elasticsearch-sync.service'
import { TitleSearchService } from './title-search.service'
import { TitleService } from './title.service'
import { TitleTransformService } from './utils/title-transform.service'

@Injectable()
export class TitleQueryService {
    private readonly logger = new Logger(TitleQueryService.name)
    private readonly CACHE_KEY_PREFIX = 'title:details:'
    private readonly TITLES_LIST_PREFIX = 'titles:list:'
    private readonly CACHE_TTL_SECONDS = 60 * 60 * 2 // 2 hours
    private readonly TITLES_CACHE_TTL_SECONDS = 60 * 15 // 15 minutes
    private CACHE_TITLE_DATE_KEYS = [
        'createdAt',
        'updatedAt',
        'lastSyncedAt',
        'release_date',
    ]

    constructor(
        private readonly titleService: TitleService,
        private readonly titleElasticsearchSyncService: TitleElasticsearchSyncService,
        private readonly titleTransformService: TitleTransformService,
        private readonly cacheService: CacheService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
        @Inject(forwardRef(() => TitleSearchService))
        private readonly titleSearchService: TitleSearchService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async getTitles(filter?: TitleFilterInput): Promise<Title[]> {
        const {
            type,
            category,
            withFilmingLocations,
            searchTerm,
            take = 12,
            skip = 0,
            releaseDateRange,
            genreIds,
            countryIsos,
            name,
            runtimeRange,
            originalLanguageIsos,
            voteAverageRange,
            statuses,
            sortBy,
            imdbId,
        } = filter || {}

        if (searchTerm && searchTerm.trim().length > 0) {
            const searchInput = new TitleSearchInput()
            searchInput.query = searchTerm
            searchInput.options = new TitleSearchOptionsInput()
            searchInput.options.from = skip
            searchInput.options.size = take

            const searchResult =
                await this.titleSearchService.searchTitles(searchInput)
            return searchResult.items
        }

        const cacheKey = this.getTitlesListCacheKey({
            type,
            category,
            withFilmingLocations,
            searchTerm,
            take,
            skip,
            releaseDateRange,
            genreIds,
            countryIsos,
            name,
            runtimeRange,
            originalLanguageIsos,
            voteAverageRange,
            statuses,
            sortBy,
            imdbId,
        })

        try {
            const cachedData = await this.cacheService.get<string>(cacheKey)

            if (cachedData) {
                return JSON.parse(cachedData, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
            }

            const dbTitles = await this.titleService.findAll(filter, {
                customRelations: this.titleRelationsConfig.FULL,
            })

            const paginatedDbTitles = dbTitles.slice(skip, skip + take)

            const titles = await Promise.all(
                paginatedDbTitles.map(async (dbTitle) => {
                    try {
                        const esTitle =
                            await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                                dbTitle.id,
                            )

                        return this.combineDbAndEsTitleData(dbTitle, esTitle)
                    } catch (error) {
                        this.logger.warn(
                            `Error getting ES details for title ${dbTitle.id}: ${error.message}`,
                        )
                        return this.combineDbAndEsTitleData(dbTitle, null)
                    }
                }),
            )

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(titles),
                this.TITLES_CACHE_TTL_SECONDS,
            )

            return titles
        } catch (error) {
            this.logger.error(`Error fetching filtered titles:`, error)
            throw error
        }
    }

    async getTitleById(id: string): Promise<Title> {
        const cacheKey = this.getTitleCacheKey(id)

        try {
            const cachedTitle = await this.cacheService.get<string>(cacheKey)
            if (cachedTitle) {
                this.logger.debug(`Cache hit for title ID: ${id}`)
                const title = JSON.parse(cachedTitle, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
                return title as Title
            }

            this.logger.debug(`Cache miss for title ID: ${id}`)

            const dbTitle = await this.titleService.findById(id, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle)
                throw new NotFoundException(`Title with ID ${id} not found`)

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    id,
                )

            const finalTitle = this.combineDbAndEsTitleData(dbTitle, esTitle)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(finalTitle),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(`Title ID: ${id} saved to cache.`)

            return finalTitle
        } catch (error) {
            this.logger.error(`Error getting title by ID ${id}:`, error)
            throw error
        }
    }

    async getTitleByTmdbId(tmdbId: string): Promise<Title> {
        let dbTitle: DbTitle
        try {
            dbTitle = await this.titleService.findByTmdbId(tmdbId, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with TMDB ID ${tmdbId} not found`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error fetching title from DB by TMDB ID ${tmdbId}:`,
                error,
            )
            throw error
        }

        const cacheKey = this.getTitleCacheKey(dbTitle.id)

        try {
            const cachedTitle = await this.cacheService.get<string>(cacheKey)
            if (cachedTitle) {
                this.logger.debug(
                    `Cache hit for title ID: ${dbTitle.id} (found by TMDB ID: ${tmdbId})`,
                )
                const title = JSON.parse(cachedTitle, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                )
                return title as Title
            }

            this.logger.debug(
                `Cache miss for title ID: ${dbTitle.id} (found by TMDB ID: ${tmdbId})`,
            )

            const esTitle =
                await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                    dbTitle.id,
                )

            const finalTitle = this.combineDbAndEsTitleData(dbTitle, esTitle)

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(finalTitle),
                this.CACHE_TTL_SECONDS,
            )
            this.logger.debug(
                `Title ID: ${dbTitle.id} saved to cache (found by TMDB ID: ${tmdbId}).`,
            )

            return finalTitle
        } catch (error) {
            this.logger.error(
                `Error processing title (DB ID ${dbTitle.id}, TMDB ID ${tmdbId}) after DB fetch:`,
                error,
            )
            throw error
        }
    }

    async getTitleByImdbId(imdbId: string): Promise<Title> {
        let dbTitle: DbTitle
        try {
            dbTitle = await this.titleService.findByImdbId(imdbId, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle) {
                throw new NotFoundException(
                    `Title with IMDB ID ${imdbId} not found`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error fetching title from DB by IMDB ID ${imdbId}:`,
                error,
            )
            throw error
        }

        return this.getTitleById(dbTitle.id)
    }

    async getTitleBySlug(slug: string): Promise<Title> {
        let dbTitle: DbTitle
        try {
            dbTitle = await this.titleService.findBySlug(slug, {
                customRelations: this.titleRelationsConfig.FULL,
            })
            if (!dbTitle) {
                throw new NotFoundException(`Title with slug ${slug} not found`)
            }
        } catch (error) {
            this.logger.error(
                `Error fetching title from DB by slug ${slug}:`,
                error,
            )
            throw error
        }

        return this.getTitleById(dbTitle.id)
    }

    combineDbAndEsTitleData(
        dbTitle: DbTitle,
        esTitle: TitleDocumentES | null,
    ): Title {
        return this.titleTransformService.mergeDbAndEsDetails(
            dbTitle,
            esTitle?.details || null,
        )
    }

    async getPopularTitles(limit: number = 5): Promise<Title[]> {
        const cacheKey = this.getPopularTitlesCacheKey(limit)
        try {
            const cachedData = await this.cacheService.get<string>(cacheKey)
            if (cachedData) {
                return JSON.parse(cachedData, (key, value) =>
                    dateReviver(this.CACHE_TITLE_DATE_KEYS, key, value),
                ) as Title[]
            }

            const result = await this.db
                .select()
                .from(popularTitles)
                .innerJoin(
                    sql.raw('titles'),
                    eq(popularTitles.titleId, sql.raw('titles.id')),
                )
                .orderBy(desc(popularTitles.count))
                .limit(limit)

            const titleIds = result.map((row) => row.popular_titles.titleId)
            const dbPopularTitles = await this.titleService.findManyByIds(
                titleIds,
                {
                    customRelations: this.titleRelationsConfig.FULL,
                },
            )

            const sortedPopularTitles = titleIds
                .map((id) => dbPopularTitles.find((title) => title.id === id))
                .filter(Boolean) as DbTitle[]

            let combinedTitles = [...sortedPopularTitles]
            const missingCount = limit - combinedTitles.length

            if (missingCount > 0) {
                this.logger.debug(
                    `Need to fill ${missingCount} more titles for popular section`,
                )
                const fallbackCategories = [
                    {
                        type: TitleType.MOVIE,
                        category: TitleCategory.TOP_RATED,
                    },
                    { type: TitleType.TV, category: TitleCategory.TOP_RATED },
                    { type: TitleType.MOVIE, category: TitleCategory.TRENDING },
                    { type: TitleType.TV, category: TitleCategory.TRENDING },
                ]

                let remainingCount = missingCount
                let usedIds = new Set(titleIds)

                for (const { type, category } of fallbackCategories) {
                    if (remainingCount <= 0) break

                    const filter: TitleFilterInput = {
                        type,
                        category,
                        take: remainingCount * 2,
                        skip: 0,
                    }

                    const results = await this.getTitles(filter)

                    const uniqueNewItems = results.filter(
                        (item) => !usedIds.has(item.id),
                    )

                    const newTitles = await Promise.all(
                        uniqueNewItems.map((item) =>
                            this.titleService.findById(item.id, {
                                customRelations: this.titleRelationsConfig.FULL,
                            }),
                        ),
                    )

                    const filteredTitles = newTitles.filter(
                        Boolean,
                    ) as DbTitle[]

                    for (const title of filteredTitles) {
                        if (remainingCount <= 0) break
                        usedIds.add(title.id)
                        combinedTitles.push(title)
                        remainingCount--
                    }
                }
            }

            const uniqueTitlesMap = new Map<string, DbTitle>()
            for (const title of combinedTitles) {
                uniqueTitlesMap.set(title.id, title)
            }
            const uniqueTitles = Array.from(uniqueTitlesMap.values()).slice(
                0,
                limit,
            )

            const titles = await Promise.all(
                uniqueTitles.map(async (dbTitle) => {
                    try {
                        const esTitle =
                            await this.titleElasticsearchSyncService.getTitleDetailsFromElasticsearch(
                                dbTitle.id,
                            )
                        return this.combineDbAndEsTitleData(dbTitle, esTitle)
                    } catch (error) {
                        this.logger.warn(
                            `Error getting ES details for popular title ${dbTitle.id}: ${error.message}`,
                        )
                        return this.combineDbAndEsTitleData(dbTitle, null)
                    }
                }),
            )

            await this.cacheService.set(
                cacheKey,
                JSON.stringify(titles),
                this.TITLES_CACHE_TTL_SECONDS / 2,
            )

            return titles
        } catch (error) {
            this.logger.error(`Error fetching popular titles:`, error)
            throw error
        }
    }

    async trackTitleSearch(
        titleId: string | null,
        slug: string | null,
    ): Promise<DbPopularTitle | null> {
        try {
            if (!titleId && slug) {
                const title = await this.titleService.findBySlug(slug)
                if (title) {
                    titleId = title.id
                }
            }

            if (!titleId) {
                this.logger.warn(
                    `Cannot track title search: no valid titleId or slug provided`,
                )
                return null
            }

            const existing = await this.db
                .select()
                .from(popularTitles)
                .where(eq(popularTitles.titleId, titleId))
                .limit(1)

            if (existing.length) {
                const [updatedTitle] = await this.db
                    .update(popularTitles)
                    .set({
                        count: sql`${popularTitles.count} + 1`,
                        updatedAt: new Date(),
                    } as Partial<DbPopularTitleInsert>)
                    .where(eq(popularTitles.id, existing[0].id))
                    .returning()

                return updatedTitle
            } else {
                const newTitle: DbPopularTitleInsert = {
                    titleId,
                }

                const [newEntry] = await this.db
                    .insert(popularTitles)
                    .values(newTitle)
                    .returning()

                return newEntry
            }
        } catch (error) {
            this.logger.error(`Error tracking title search:`, error)
            return null
        }
    }

    getCacheTitleDateKeys(): string[] {
        return this.CACHE_TITLE_DATE_KEYS
    }

    private getTitlesListCacheKey(params: {
        type?: string
        category?: string
        withFilmingLocations?: boolean
        searchTerm?: string
        take: number
        skip: number
        releaseDateRange?: any
        genreIds?: string[]
        countryIsos?: string[]
        name?: string
        runtimeRange?: any
        originalLanguageIsos?: string[]
        voteAverageRange?: any
        statuses?: string[]
        sortBy?: string
        imdbId?: string
    }): string {
        const {
            type = 'all',
            category = 'all',
            withFilmingLocations,
            searchTerm = '',
            take,
            skip,
            releaseDateRange,
            genreIds,
            countryIsos,
            name,
            runtimeRange,
            originalLanguageIsos,
            voteAverageRange,
            statuses,
            sortBy,
            imdbId,
        } = params

        let key = `${this.TITLES_LIST_PREFIX}type-${type}:category-${category}:${withFilmingLocations ? 'withLoc' : 'allLoc'}:search-${searchTerm}:${take}:${skip}`

        if (releaseDateRange) {
            key += `:date-${releaseDateRange.from || ''}-${releaseDateRange.to || ''}`
        }
        if (genreIds && genreIds.length) {
            key += `:genres-${genreIds.join(',')}`
        }
        if (countryIsos && countryIsos.length) {
            key += `:countries-${countryIsos.join(',')}`
        }
        if (name) {
            key += `:name-${name}`
        }
        if (runtimeRange) {
            key += `:runtime-${runtimeRange.from || ''}-${runtimeRange.to || ''}`
        }
        if (originalLanguageIsos && originalLanguageIsos.length) {
            key += `:langs-${originalLanguageIsos.join(',')}`
        }
        if (voteAverageRange) {
            key += `:vote-${voteAverageRange.from || ''}-${voteAverageRange.to || ''}`
        }
        if (statuses && statuses.length) {
            key += `:status-${statuses.join(',')}`
        }
        if (sortBy) {
            key += `:sort-${sortBy}`
        }
        if (imdbId) {
            key += `:imdbId-${imdbId}`
        }

        return key
    }

    private getTitleCacheKey(id: string): string {
        return `${this.CACHE_KEY_PREFIX}${id}`
    }

    private getPopularTitlesCacheKey(limit: number): string {
        return `${this.TITLES_LIST_PREFIX}popular:${limit}`
    }
}
