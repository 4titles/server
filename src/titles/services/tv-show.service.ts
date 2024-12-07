import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { TmdbService } from 'src/tmdb/tmdb-service'
import { TitleEntityService } from './title-entity.service'
import { ShowResponse, TvResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShowMapper } from '../mappers/tv-show.mapper'
import { TvShow } from '../models/tv-show.model'
import { LocationsService } from 'src/locations/services/locations.service'

@Injectable()
export class TvShowService {
    private readonly logger = new Logger(TvShowService.name)
    private readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly cacheService: CacheService,
        private readonly titleEntityService: TitleEntityService,
        private readonly locationsService: LocationsService,
    ) {}

    async syncPopularTvShows(): Promise<ShowResponse[]> {
        try {
            const tvShows: ShowResponse[] = []
            let page = 1

            while (tvShows.length < 100 && page <= 5) {
                const { results } =
                    await this.tmdbService.getPopularTvShows(page)
                const validShows = results.filter(
                    (show) => show.overview && show.name && show.poster_path,
                )

                for (const show of validShows) {
                    if (tvShows.length >= 100) break
                    const fullShow = await this.syncTvShow(
                        show.id,
                        TitleCategory.POPULAR,
                    )
                    tvShows.push(fullShow)
                }

                page++
            }

            return tvShows
        } catch (error) {
            this.logger.error('Failed to sync popular TV shows:', error)
            throw error
        }
    }

    async syncTrendingTvShows(): Promise<ShowResponse[]> {
        try {
            const { results } = await this.tmdbService.getTrendingTvShows()
            const validShows = results
                .filter(
                    (item): item is TvResult =>
                        item.media_type === 'tv' &&
                        !!item.overview &&
                        !!item.name &&
                        !!item.poster_path,
                )
                .slice(0, 50)

            const tvShows = await Promise.all(
                validShows.map((show) =>
                    this.syncTvShow(show.id, TitleCategory.TRENDING),
                ),
            )

            this.logger.log(
                `Successfully synced ${tvShows.length} trending TV shows`,
            )
            return tvShows
        } catch (error) {
            this.logger.error('Failed to sync trending TV shows:', error)
            throw error
        }
    }

    async syncTopRatedTvShows(limit: number = 100): Promise<ShowResponse[]> {
        try {
            const tvShows: ShowResponse[] = []
            let page = 1

            while (tvShows.length < limit && page <= 5) {
                const { results } =
                    await this.tmdbService.getTopRatedTvShows(page)
                const validShows = results.filter(
                    (show) => show.overview && show.name && show.poster_path,
                )

                for (const show of validShows) {
                    if (tvShows.length >= limit) break
                    const fullShow = await this.syncTvShow(
                        show.id,
                        TitleCategory.TOP_RATED,
                    )
                    tvShows.push(fullShow)
                }

                page++
            }

            this.logger.log(
                `Successfully synced ${tvShows.length} top rated TV shows`,
            )
            return tvShows
        } catch (error) {
            this.logger.error('Failed to sync top rated TV shows:', error)
            throw error
        }
    }

    async syncTvShow(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<TvShow> {
        try {
            const cacheKey = `tv_${tmdbId}`
            const locationsCacheKey = `tv_locations_${tmdbId}`

            const tvShowResponse = await this.tmdbService.getTvDetails(tmdbId)
            const tvShow = TvShowMapper.mapShowResponseToTvShow(
                tvShowResponse,
                category,
            )

            await this.titleEntityService.createOrUpdateTvShow(tvShow)

            this.logger.log(
                `Syncing locations for TV show ${tvShow.imdbId} with category ${category}`,
            )

            if (tvShowResponse.imdb_id) {
                // Синхронизируем и получаем локации
                await this.locationsService.syncLocationsForTitle(
                    tvShowResponse.imdb_id,
                )
                const locations =
                    await this.locationsService.getLocationsForTitle(
                        tvShowResponse.imdb_id,
                        false,
                    )

                // Добавляем локации к объекту tvShow
                tvShow.filmingLocations = locations

                // Кэшируем отдельно локации
                await this.cacheService.set(
                    locationsCacheKey,
                    locations,
                    this.CACHE_TTL,
                )
            }

            // Кэшируем полный объект tvShow с локациями
            await this.cacheService.set(
                cacheKey,
                {
                    ...tvShowResponse,
                    filmingLocations: tvShow.filmingLocations,
                },
                this.CACHE_TTL,
            )

            return tvShow
        } catch (error) {
            this.logger.error('Failed to sync TV show:', error)
            throw error
        }
    }

    async getTvShowDetails(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<TvShow> {
        const cacheKey = `tv_${tmdbId}`

        try {
            const cached = await this.cacheService.get<
                ShowResponse & { filmingLocations: any[] }
            >(cacheKey)

            if (cached) {
                const tvShow = TvShowMapper.mapShowResponseToTvShow(
                    cached as TvShow & { imdb_id: string },
                    category,
                )
                tvShow.filmingLocations = cached.filmingLocations
                return tvShow
            }

            return this.syncTvShow(tmdbId, category)
        } catch (error) {
            this.logger.error(`Failed to get TV show details: ${error.message}`)
            throw error
        }
    }

    async searchTvShows(query: string, limit: number = 20): Promise<TvShow[]> {
        const { results } = await this.tmdbService.searchTvShows(query)
        this.logger.log(`Found ${results.length} TV shows for query: ${query}`)
        return Promise.all(
            results
                .slice(0, limit)
                .map((result) =>
                    this.getTvShowDetails(result.id, TitleCategory.SEARCH),
                ),
        )
    }

    async getTvShows(
        limit: number = 20,
        category?: TitleCategory,
    ): Promise<TvShow[]> {
        try {
            if (!category) {
                return this.titleEntityService.getAllTvShows()
            }

            switch (category) {
                case TitleCategory.POPULAR:
                    return this.getPopularTvShows(limit)
                case TitleCategory.TOP_RATED:
                    return this.getTopRatedTvShows(limit)
                case TitleCategory.TRENDING:
                    return this.getTrendingTvShows(limit)
                default:
                    throw new Error('Invalid category')
            }
        } catch (error) {
            this.logger.error('Failed to get TV shows:', error)
            throw error
        }
    }

    async getPopularTvShows(limit: number = 20): Promise<TvShow[]> {
        return this.titleEntityService.getPopularTvShows(limit)
    }

    async getTopRatedTvShows(limit: number = 20): Promise<TvShow[]> {
        return this.titleEntityService.getTopRatedTvShows(limit)
    }

    async getTrendingTvShows(limit: number = 20): Promise<TvShow[]> {
        return this.titleEntityService.getTrendingTvShows(limit)
    }
}
