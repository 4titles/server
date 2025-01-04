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
import { DbMovie } from '@/modules/drizzle/schema/movies.schema'
import { DbSeries } from '@/modules/drizzle/schema/series.schema'
import { TmdbService } from '@/modules/tmdb/tmdb.service'
import { TitleMapper } from '../mappers/title.mapper'
import { TvShowMapper } from '../mappers/tv-show.mapper'
import { MovieMapper } from '../mappers/movie.mapper'
import { GenreService } from './genre.service'
import { LanguageService } from './language.service'

@Injectable()
export abstract class BaseTitleSyncService<T extends Title> {
    protected readonly logger = new Logger(this.constructor.name)
    protected readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        protected readonly titleMapper: TitleMapper,
        protected readonly movieMapper: MovieMapper,
        protected readonly tvShowMapper: TvShowMapper,
        protected readonly tmdbService: TmdbService,
        protected readonly cacheService: CacheService,
        protected readonly movieEntityService: MovieEntityService,
        protected readonly tvShowEntityService: TvShowEntityService,
        protected readonly locationsService: LocationsService,
        protected readonly genreService: GenreService,
        protected readonly languageService: LanguageService,
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
        mapper: (response: any, category: TitleCategory) => Promise<T>,
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
            const item: T = await mapper(response, category)
            const isMovie: boolean = titleType === TitleType.MOVIES

            if (isMovie) {
                await this.movieEntityService.createOrUpdate(item as DbMovie)
            } else {
                await this.tvShowEntityService.createOrUpdate(item as DbSeries)
            }

            if (response.imdb_id) {
                this.logger.log(
                    `Syncing locations for ${titleType} with imdbId ${item.imdbId}, with category ${category}`,
                )
                await this.locationsService.syncLocationsForTitle(
                    response.imdb_id,
                )
                const locations =
                    await this.locationsService.getLocationsForTitle(
                        response.imdb_id,
                        isMovie,
                    )
                item.filmingLocations = locations

                await this.cacheService.set(
                    locationsCacheKey,
                    locations,
                    this.CACHE_TTL,
                )
            }

            if (item.genres?.length) {
                this.logger.log(
                    `Syncing genres for ${titleType} with imdbId ${item.imdbId}, with category ${category}`,
                )
                await this.genreService.syncGenresForTitle(
                    item.imdbId,
                    item.genres,
                )

                item.genres = await this.genreService.getGenresForTitle(
                    item.imdbId,
                    isMovie,
                )
            }

            this.logger.log(
                `Syncing languages for ${titleType} with imdbId ${item.imdbId}, with category ${category}`,
            )

            if (isMovie) {
                await this.languageService.syncLanguagesForMovie(
                    item.imdbId,
                    response.original_language,
                    response.spoken_languages,
                )
            } else {
                await this.languageService.syncLanguagesForSeries(
                    item.imdbId,
                    response.original_language,
                    response.spoken_languages,
                    response.languages,
                )
            }

            item.languages = await this.languageService.getLanguagesForTitle(
                item.imdbId,
            )

            await this.cacheService.set(cacheKey, item, this.CACHE_TTL)
            return item
        } catch (error) {
            this.logger.error(`Failed to sync ${titleType} ${tmdbId}:`, error)
            throw error
        }
    }
}
