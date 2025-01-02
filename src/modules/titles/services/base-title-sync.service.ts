import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from '@/modules/cache/cache.service'
import { LocationsService } from '@/modules/locations/services/locations.service'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieResult, TvResult } from 'moviedb-promise'
import { TitleType } from '@/graphql'
import { DEFAULT_FETCH_LIMIT } from './constants/query.constants'
import { Title } from '../types/title.type'
import { MovieEntityService } from './entity/movie-entity.service'
import { TvShowEntityService } from './entity/tv-show-entity.service'
import { DbMovie } from '@/drizzle/schema/movies.schema'
import { DbSeries } from '@/drizzle/schema/series.schema'
import { TmdbService } from '@/modules/tmdb/tmdb-service'

@Injectable()
export abstract class BaseTitleSyncService<T extends Title> {
    protected readonly logger = new Logger(this.constructor.name)
    protected readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        protected readonly tmdbService: TmdbService,
        protected readonly cacheService: CacheService,
        protected readonly movieEntityService: MovieEntityService,
        protected readonly tvShowEntityService: TvShowEntityService,
        protected readonly locationsService: LocationsService,
    ) {}

    protected abstract syncTitle(
        id: number,
        category: TitleCategory,
    ): Promise<T>
    protected abstract isValidTitle(item: any): boolean

    async syncTitlesByCategory(
        category: TitleCategory,
        limit: number = DEFAULT_FETCH_LIMIT,
        fetchItems: (page: number) => Promise<MovieResult[] | TvResult[]>,
    ): Promise<T[]> {
        try {
            const items: T[] = []
            let page = 1

            while (items.length < limit && page <= 5) {
                const results = await fetchItems(page)
                const validItems = results.filter(this.isValidTitle)

                for (const item of validItems) {
                    if (items.length >= limit) break
                    const fullItem = await this.syncTitle(item.id, category)
                    items.push(fullItem)
                }

                page++
            }

            this.logger.log(
                `Successfully synced ${category} ${items.length} items`,
            )
            return items
        } catch (error) {
            this.logger.error(`Failed to sync ${category} titles:`, error)
            throw error
        }
    }

    async syncTrendingTitles(
        titleType: TitleType,
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<T[]> {
        try {
            const { results } =
                titleType === TitleType.MOVIES
                    ? await this.tmdbService.getTrendingMovies()
                    : await this.tmdbService.getTrendingTvShows()
            const validItems = results.filter(this.isValidTitle).slice(0, limit)

            const items = await Promise.all(
                validItems.map((item) =>
                    this.syncTitle(item.id, TitleCategory.TRENDING),
                ),
            )

            this.logger.log(
                `Successfully synced ${items.length} trending titles`,
            )
            return items
        } catch (error) {
            this.logger.error(`Failed to sync trending titles:`, error)
            throw error
        }
    }

    protected async syncTitleWithDetails(
        tmdbId: number,
        titleType: TitleType,
        category: TitleCategory,
        fetchDetails: (id: number) => Promise<any>,
        mapper: (response: any, category: TitleCategory) => T,
    ): Promise<T> {
        const cacheKey = `${category}_${titleType}_${tmdbId}`
        const locationsCacheKey = `${category}_${titleType}_locations_${tmdbId}`

        try {
            const cached = await this.cacheService.get<
                T & { filmingLocations: any[] }
            >(cacheKey)

            if (cached) {
                return cached
            }

            const response = await fetchDetails(tmdbId)
            const item = mapper(response, category)

            if (titleType === TitleType.MOVIES) {
                await this.movieEntityService.createOrUpdate(item as DbMovie)
            } else {
                await this.tvShowEntityService.createOrUpdate(item as DbSeries)
            }

            this.logger.log(
                `Syncing locations for ${titleType} with imdbId ${item.imdbId}, with category ${category}`,
            )

            if (response.imdb_id) {
                await this.locationsService.syncLocationsForTitle(
                    response.imdb_id,
                )
                const locations =
                    await this.locationsService.getLocationsForTitle(
                        response.imdb_id,
                        true,
                    )
                item.filmingLocations = locations

                await this.cacheService.set(
                    locationsCacheKey,
                    locations,
                    this.CACHE_TTL,
                )
            }

            await this.cacheService.set(cacheKey, item, this.CACHE_TTL)
            return item
        } catch (error) {
            this.logger.error(`Failed to sync ${titleType} ${tmdbId}:`, error)
            throw error
        }
    }
}
