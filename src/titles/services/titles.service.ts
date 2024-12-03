import { Injectable, Logger } from '@nestjs/common'
import { MovieResponse, ShowResponse } from 'moviedb-promise'
import { CacheService } from '../../cache/cache.service'
import { TitleEntityService } from './title-entity.service'
import { TmdbService } from 'src/tmdb/tmdb-service'

@Injectable()
export class TitlesService {
    private readonly logger = new Logger(TitlesService.name)
    private readonly CACHE_TTL = 24 * 60 * 60 // 24 hours

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly cacheService: CacheService,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async syncPopularMovies() {
        try {
            const cacheKey = 'popular_movies_list'
            let popularMoviesIds =
                await this.cacheService.get<number[]>(cacheKey)

            if (!popularMoviesIds) {
                const { results } = await this.tmdbService.getPopularMovies()
                popularMoviesIds = results.map((movie) => movie.id)
                await this.cacheService.set(
                    cacheKey,
                    popularMoviesIds,
                    this.CACHE_TTL,
                )
            }

            const movies = await Promise.all(
                popularMoviesIds.map(async (id) => {
                    const movieCacheKey = `movie_${id}`
                    let movie =
                        await this.cacheService.get<MovieResponse>(
                            movieCacheKey,
                        )

                    if (!movie) {
                        movie = await this.tmdbService.getMovieDetails(id)
                        await this.cacheService.set(
                            movieCacheKey,
                            movie,
                            this.CACHE_TTL,
                        )
                    }

                    await this.titleEntityService.createOrUpdateMovie(movie)
                    return movie
                }),
            )

            this.logger.log(
                `Successfully synced ${movies.length} popular movies`,
            )
            return movies
        } catch (error) {
            this.logger.error('Failed to sync popular movies:', error)
            throw error
        }
    }

    async syncPopularTvShows() {
        try {
            const cacheKey = 'popular_tv_list'
            let popularTvIds = await this.cacheService.get<number[]>(cacheKey)

            if (!popularTvIds) {
                const { results } = await this.tmdbService.getPopularTvShows()
                popularTvIds = results.map((tv) => tv.id)
                await this.cacheService.set(
                    cacheKey,
                    popularTvIds,
                    this.CACHE_TTL,
                )
            }

            const tvShows = await Promise.all(
                popularTvIds.map(async (id) => {
                    const tvCacheKey = `tv_${id}`
                    let tvShow = await this.cacheService.get<
                        ShowResponse & { imdb_id: string }
                    >(tvCacheKey)

                    if (!tvShow) {
                        tvShow = await this.tmdbService.getTvDetails(id)
                        await this.cacheService.set(
                            tvCacheKey,
                            tvShow,
                            this.CACHE_TTL,
                        )
                    }

                    await this.titleEntityService.createOrUpdateTvShow(tvShow)
                    return tvShow
                }),
            )

            this.logger.log(
                `Successfully synced ${tvShows.length} popular TV shows`,
            )
            return tvShows
        } catch (error) {
            this.logger.error('Failed to sync popular TV shows:', error)
            throw error
        }
    }

    async getMovieDetails(tmdbId: number) {
        const cacheKey = `movie_${tmdbId}`
        let movie = await this.cacheService.get<MovieResponse>(cacheKey)

        if (!movie) {
            movie = await this.tmdbService.getMovieDetails(tmdbId)
            await this.cacheService.set(cacheKey, movie, this.CACHE_TTL)
            await this.titleEntityService.createOrUpdateMovie(movie)
        }

        return movie
    }

    async getTvShowDetails(tmdbId: number) {
        const cacheKey = `tv_${tmdbId}`
        let tvShow = await this.cacheService.get<
            ShowResponse & { imdb_id: string }
        >(cacheKey)

        if (!tvShow) {
            tvShow = await this.tmdbService.getTvDetails(tmdbId)
            await this.cacheService.set(cacheKey, tvShow, this.CACHE_TTL)
            await this.titleEntityService.createOrUpdateTvShow(tvShow)
        }

        return tvShow
    }

    async getPopularMovies(limit: number = 20) {
        return this.titleEntityService.getPopularMovies(limit)
    }

    async getPopularTvShows(limit: number = 20) {
        return this.titleEntityService.getPopularTvShows(limit)
    }

    async searchMovies(query: string, limit: number = 20) {
        try {
            const { results } = await this.tmdbService.searchMovies(query)
            const movies = await Promise.all(
                results
                    .slice(0, limit)
                    .map((result) => this.getMovieDetails(result.id)),
            )
            return movies
        } catch (error) {
            this.logger.error(
                `Failed to search movies with query "${query}":`,
                error,
            )
            throw error
        }
    }

    async searchTvShows(query: string, limit: number = 20) {
        try {
            const { results } = await this.tmdbService.searchTvShows(query)
            const tvShows = await Promise.all(
                results
                    .slice(0, limit)
                    .map((result) => this.getTvShowDetails(result.id)),
            )
            return tvShows
        } catch (error) {
            this.logger.error(
                `Failed to search TV shows with query "${query}":`,
                error,
            )
            throw error
        }
    }

    private async invalidateMovieCache(tmdbId: number) {
        await this.cacheService.del(`movie_${tmdbId}`)
    }

    private async invalidateTvShowCache(tmdbId: number) {
        await this.cacheService.del(`tv_${tmdbId}`)
    }

    async forceUpdateMovie(tmdbId: number) {
        await this.invalidateMovieCache(tmdbId)
        return this.getMovieDetails(tmdbId)
    }

    async forceUpdateTvShow(tmdbId: number) {
        await this.invalidateTvShowCache(tmdbId)
        return this.getTvShowDetails(tmdbId)
    }
}
