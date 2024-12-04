import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { TmdbService } from 'src/tmdb/tmdb-service'
import { TitleEntityService } from './title-entity.service'
import { MovieResponse, MovieResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'

@Injectable()
export class MovieService {
    private readonly logger = new Logger(MovieService.name)
    private readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly cacheService: CacheService,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async syncPopularMovies(): Promise<MovieResponse[]> {
        try {
            const movies: MovieResponse[] = []
            let page = 1

            while (movies.length < 100 && page <= 5) {
                const { results } =
                    await this.tmdbService.getPopularMovies(page)
                const validMovies = results.filter(
                    (movie) =>
                        movie.overview && movie.title && movie.poster_path,
                )

                for (const movie of validMovies) {
                    if (movies.length >= 100) break
                    const fullMovie = await this.syncMovie(
                        movie.id,
                        TitleCategory.POPULAR,
                    )
                    movies.push(fullMovie)
                }

                page++
            }

            return movies
        } catch (error) {
            this.logger.error('Failed to sync popular movies:', error)
            throw error
        }
    }

    async syncTopRatedMovies(): Promise<MovieResponse[]> {
        try {
            const movies: MovieResponse[] = []
            let page = 1

            while (movies.length < 100 && page <= 5) {
                const { results } =
                    await this.tmdbService.getTopRatedMovies(page)
                const validMovies = results.filter(
                    (movie) =>
                        movie.overview && movie.title && movie.poster_path,
                )

                for (const movie of validMovies) {
                    if (movies.length >= 100) break
                    const fullMovie = await this.syncMovie(
                        movie.id,
                        TitleCategory.TOP_RATED,
                    )
                    movies.push(fullMovie)
                }

                page++
            }

            return movies
        } catch (error) {
            this.logger.error('Failed to sync top rated movies:', error)
            throw error
        }
    }

    async syncTrendingMovies(): Promise<MovieResponse[]> {
        try {
            const { results } = await this.tmdbService.getTrendingMovies()
            const validMovies = results
                .filter(
                    (item): item is MovieResult =>
                        item.media_type === 'movie' &&
                        !!item.overview &&
                        !!item.title &&
                        !!item.poster_path,
                )
                .slice(0, 50)

            const movies = await Promise.all(
                validMovies.map((movie) =>
                    this.syncMovie(movie.id, TitleCategory.TRENDING),
                ),
            )

            this.logger.log(
                `Successfully synced ${movies.length} trending movies`,
            )
            return movies
        } catch (error) {
            this.logger.error('Failed to sync trending movies:', error)
            throw error
        }
    }
    async syncMovie(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<MovieResponse> {
        const movie = await this.tmdbService.getMovieDetails(tmdbId)
        await this.titleEntityService.createOrUpdateMovie(movie, category)
        await this.cacheService.set(`movie_${tmdbId}`, movie, this.CACHE_TTL)
        return movie
    }

    async getMovieDetails(tmdbId: number): Promise<MovieResponse> {
        const cacheKey = `movie_${tmdbId}`
        const cached = await this.cacheService.get<MovieResponse>(cacheKey)
        if (cached) return cached

        return this.syncMovie(tmdbId)
    }

    async searchMovies(
        query: string,
        limit: number = 20,
    ): Promise<MovieResponse[]> {
        const { results } = await this.tmdbService.searchMovies(query)
        return Promise.all(
            results
                .slice(0, limit)
                .map((result) => this.getMovieDetails(result.id)),
        )
    }

    async getMovies(limit: number = 20, category?: TitleCategory) {
        try {
            if (!category) {
                return this.titleEntityService.getAllMovies(limit)
            }

            switch (category) {
                case TitleCategory.POPULAR:
                    return this.getPopularMovies(limit)
                case TitleCategory.TOP_RATED:
                    return this.getTopRatedMovies(limit)
                case TitleCategory.TRENDING:
                    return this.getTrendingMovies(limit)
                default:
                    throw new Error('Invalid category')
            }
        } catch (error) {
            this.logger.error(`Failed to get movies: ${error.message}`)
            throw error
        }
    }

    async getPopularMovies(limit: number = 20) {
        return this.titleEntityService.getPopularMovies(limit)
    }

    async getTopRatedMovies(limit: number = 20) {
        return this.titleEntityService.getTopRatedMovies(limit)
    }

    async getTrendingMovies(limit: number = 20) {
        return this.titleEntityService.getTrendingMovies(limit)
    }
}
