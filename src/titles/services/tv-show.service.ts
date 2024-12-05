import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { TmdbService } from 'src/tmdb/tmdb-service'
import { TitleEntityService } from './title-entity.service'
import { ShowResponse, TvResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShowMapper } from '../mappers/tv-show.mapper'
import { TvShow } from '../models/tv-show.model'

@Injectable()
export class TvShowService {
    private readonly logger = new Logger(TvShowService.name)
    private readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly cacheService: CacheService,
        private readonly titleEntityService: TitleEntityService,
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
            const tvShowResponse = await this.tmdbService.getTvDetails(tmdbId)

            await this.cacheService.set(
                `tv_${tmdbId}`,
                tvShowResponse,
                this.CACHE_TTL,
            )

            const tvShow = TvShowMapper.mapShowResponseToTvShow(
                tvShowResponse,
                category,
            )

            //@todo identify should save to db search results
            if (category !== TitleCategory.SEARCH) {
                await this.titleEntityService.createOrUpdateTvShow(tvShow)
            }

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
        const cached = await this.cacheService.get<ShowResponse>(cacheKey)

        if (cached) {
            return TvShowMapper.mapShowResponseToTvShow(
                cached as ShowResponse & { imdb_id: string },
                category,
            )
        }

        return this.syncTvShow(tmdbId, category)
    }

    async searchTvShows(query: string, limit: number = 20): Promise<TvShow[]> {
        const { results } = await this.tmdbService.searchTvShows(query)
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
                return this.titleEntityService.getAllTvShows(limit)
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
