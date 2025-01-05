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
import { GroupedLanguages } from '../types/language.type'
import { Genre } from '../models/genre.model'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'

interface TitleSyncContext {
    tmdbId: number
    titleType: TitleType
    category: TitleCategory
    imdbId?: string
    response: any
}

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
        const cacheKey = this.generateCacheKey(category, titleType, tmdbId)

        try {
            const response = await fetchDetails(tmdbId)
            const item = await this.processTitleDetails(
                {
                    tmdbId,
                    titleType,
                    category,
                    response,
                    imdbId: response.imdb_id,
                },
                mapper,
            )

            await this.cacheService.set(cacheKey, item, this.CACHE_TTL)
            return item
        } catch (error) {
            this.logger.error(`Failed to sync ${titleType} ${tmdbId}:`, error)
            throw error
        }
    }

    private async processTitleDetails(
        context: TitleSyncContext,
        mapper: (response: any, category: TitleCategory) => Promise<T>,
    ): Promise<T> {
        const item: T = await mapper(context.response, context.category)
        const isMovie = context.titleType === TitleType.MOVIES

        await this.persistTitleToDatabase(item, isMovie)

        if (context.imdbId) {
            item.filmingLocations = await this.syncLocations(
                context,
                item.imdbId,
                isMovie,
            )
        }

        if (item.genres?.length) {
            item.genres = await this.syncGenres(context, item)
        }

        item.languages = await this.syncLanguages(context, item.imdbId)

        return item
    }

    private async persistTitleToDatabase(
        item: T,
        isMovie: boolean,
    ): Promise<void> {
        if (isMovie) {
            await this.movieEntityService.createOrUpdate(item as DbMovie)
        } else {
            await this.tvShowEntityService.createOrUpdate(item as DbSeries)
        }
    }

    private async syncLocations(
        context: TitleSyncContext,
        imdbId: string,
        isMovie: boolean,
    ): Promise<FilmingLocation[]> {
        this.logSync('locations', context)

        const locationsCacheKey = this.generateLocationsCacheKey(context)
        await this.locationsService.syncLocationsForTitle(imdbId)
        const locations = await this.locationsService.getLocationsForTitle(
            imdbId,
            isMovie,
        )

        await this.cacheService.set(
            locationsCacheKey,
            locations,
            this.CACHE_TTL,
        )
        return locations
    }

    private async syncGenres(
        context: TitleSyncContext,
        item: T,
    ): Promise<Genre[]> {
        this.logSync('genres', context)

        await this.genreService.syncGenresForTitle(item.imdbId, item.genres)
        return this.genreService.getGenresForTitle(
            item.imdbId,
            context.titleType === TitleType.MOVIES,
        )
    }

    private async syncLanguages(
        context: TitleSyncContext,
        imdbId: string,
    ): Promise<GroupedLanguages> {
        this.logSync('languages', context)

        if (context.titleType === TitleType.MOVIES) {
            await this.languageService.syncLanguagesForMovie(
                imdbId,
                context.response.original_language,
                context.response.spoken_languages,
            )
        } else {
            await this.languageService.syncLanguagesForSeries(
                imdbId,
                context.response.original_language,
                context.response.spoken_languages,
                context.response.languages,
            )
        }

        return this.languageService.getLanguagesForTitle(
            imdbId,
            context.titleType,
        )
    }

    private async getCachedTitle(cacheKey: string): Promise<T | null> {
        return this.cacheService.get(cacheKey)
    }

    private generateCacheKey(
        category: TitleCategory,
        titleType: TitleType,
        tmdbId: number,
    ): string {
        return `${category}_${titleType}_${tmdbId}`
    }

    private generateLocationsCacheKey(context: TitleSyncContext): string {
        return `${context.category}_${context.titleType}_locations_${context.tmdbId}`
    }

    private logSync(entityType: string, context: TitleSyncContext): void {
        this.logger.log(
            `Syncing ${entityType} for ${context.titleType} with imdbId ${context.imdbId}, with category ${context.category}`,
        )
    }
}
