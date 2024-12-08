import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { TmdbService } from 'src/tmdb/tmdb-service'
import { TitleEntityService } from './title-entity.service'
import { MovieResponse, MovieResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieMapper } from '../mappers/movie-mapper'
import { Movie } from '../models/movie.model'
import { LocationsService } from 'src/locations/services/locations.service'

@Injectable()
export class MovieService {
    private readonly logger = new Logger(MovieService.name)
    private readonly CACHE_TTL = 24 * 60 * 60

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly cacheService: CacheService,
        private readonly titleEntityService: TitleEntityService,
        private readonly locationsService: LocationsService,
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

    async syncTopRatedMovies(limit: number = 100): Promise<Movie[]> {
        try {
            const movies: Movie[] = []
            let page = 1

            while (movies.length < limit && page <= 5) {
                const { results } =
                    await this.tmdbService.getTopRatedMovies(page)
                const validMovies = results.filter(
                    (movie) =>
                        movie.overview && movie.title && movie.poster_path,
                )

                for (const movie of validMovies) {
                    if (movies.length >= limit) break
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

    async syncUpComingMovies(limit: number = 100): Promise<Movie[]> {
        try {
            const movies: Movie[] = []
            let page = 1

            while (movies.length < limit && page <= 5) {
                const { results } =
                    await this.tmdbService.getUpcomingMovies(page)
                const validMovies = results.filter(
                    (movie) =>
                        movie.overview && movie.title && movie.poster_path,
                )

                for (const movie of validMovies) {
                    if (movies.length >= limit) break
                    const fullMovie = await this.syncMovie(
                        movie.id,
                        TitleCategory.UPCOMING,
                    )
                    movies.push(fullMovie)
                }

                page++
            }

            return movies
        } catch (error) {
            this.logger.error('Failed to sync upcoming movies:', error)
            throw error
        }
    }

    async syncTrendingMovies(): Promise<Movie[]> {
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
    ): Promise<Movie> {
        try {
            const cacheKey = `movie_${tmdbId}`
            const locationsCacheKey = `movie_locations_${tmdbId}`

            const movieResponse = await this.tmdbService.getMovieDetails(tmdbId)
            const movie = MovieMapper.mapMovieResponseToMovie(
                movieResponse,
                category,
            )

            await this.titleEntityService.createOrUpdateMovie(movie)

            this.logger.log(
                `Syncing locations for movie ${movie.imdbId} with category ${category}`,
            )

            if (movieResponse.imdb_id) {
                await this.locationsService.syncLocationsForTitle(
                    movieResponse.imdb_id,
                )
                const locations =
                    await this.locationsService.getLocationsForTitle(
                        movieResponse.imdb_id,
                        true,
                    )

                movie.filmingLocations = locations

                await this.cacheService.set(
                    locationsCacheKey,
                    locations,
                    this.CACHE_TTL,
                )
            }

            await this.cacheService.set(
                cacheKey,
                {
                    ...movieResponse,
                    filmingLocations: movie.filmingLocations,
                },
                this.CACHE_TTL,
            )

            return movie
        } catch (error) {
            this.logger.error('Failed to sync movie:', error)
            throw error
        }
    }

    async getMovieDetails(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<Movie> {
        const cacheKey = `movie_${tmdbId}`

        try {
            const cached = await this.cacheService.get<
                MovieResponse & { filmingLocations: any[] }
            >(cacheKey)

            if (cached) {
                const movie = MovieMapper.mapMovieResponseToMovie(
                    cached as Movie & { imdb_id: string },
                    category,
                )
                movie.filmingLocations = cached.filmingLocations
                return movie
            }

            return this.syncMovie(tmdbId, category)
        } catch (error) {
            this.logger.error(`Failed to get movie details: ${error.message}`)
            throw error
        }
    }

    async searchMovies(
        query: string,
        limit: number = 20,
    ): Promise<MovieResponse[]> {
        const { results } = await this.tmdbService.searchMovies(query)
        return Promise.all(
            results
                .slice(0, limit)
                .map((result) =>
                    this.getMovieDetails(result.id, TitleCategory.SEARCH),
                ),
        )
    }

    async getMovies(
        limit: number = 20,
        category?: TitleCategory,
    ): Promise<Movie[]> {
        try {
            if (!category) {
                return this.titleEntityService.getAllMovies()
            }

            switch (category) {
                case TitleCategory.POPULAR:
                    return this.getPopularMovies(limit)
                case TitleCategory.TOP_RATED:
                    return this.getTopRatedMovies(limit)
                case TitleCategory.TRENDING:
                    return this.getTrendingMovies(limit)
                case TitleCategory.SEARCH:
                    return this.getSearchedMovies(limit)
                case TitleCategory.UPCOMING:
                    return this.getUpComingMovies(limit)
                default:
                    throw new Error('Invalid category')
            }
        } catch (error) {
            this.logger.error(`Failed to get movies: ${error.message}`)
            throw error
        }
    }

    async getPopularMovies(limit: number = 20): Promise<Movie[]> {
        return this.titleEntityService.getPopularMovies(limit, {
            includeRelations: true,
        })
    }

    async getTopRatedMovies(limit: number = 20): Promise<Movie[]> {
        return this.titleEntityService.getTopRatedMovies(limit, {
            includeRelations: true,
        })
    }

    async getTrendingMovies(limit: number = 20): Promise<Movie[]> {
        return this.titleEntityService.getTrendingMovies(limit, {
            includeRelations: true,
        })
    }

    async getSearchedMovies(limit: number = 20): Promise<Movie[]> {
        return this.titleEntityService.getSearchedMovies(limit, {
            includeRelations: true,
        })
    }

    async getUpComingMovies(limit: number = 20): Promise<Movie[]> {
        return this.titleEntityService.getUpComingMovies(limit, {
            includeRelations: true,
        })
    }
}
