import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    CountriesResponse,
    CreditsResponse,
    ExternalId,
    Language,
    MovieDb,
    MovieImagesResponse,
    MovieRecommendationsResponse,
    MovieResultsResponse,
    SimilarMovieResponse,
    TrendingResponse,
    TvImagesResponse,
    TvResultsResponse,
    TvSimilarShowsResponse,
} from 'moviedb-promise'
import { firstValueFrom } from 'rxjs'
import { TmdbException } from './exceptions/tmdb.exception'
import {
    ExtendedMovieResponse,
    ExtendedShowResponse,
} from './types/tmdb.interface'

@Injectable()
export class TmdbService {
    private readonly moviedb: MovieDb
    private readonly logger = new Logger(TmdbService.name)
    private readonly defaultLanguage: string
    private readonly defaultRegion: string

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        const apiKey = this.configService.get<string>('tmdb.apiKey')
        if (!apiKey) {
            throw new Error('TMDB_API_KEY is not defined')
        }

        this.moviedb = new MovieDb(apiKey)
        this.defaultLanguage =
            this.configService.get<string>('tmdb.defaultLanguage') ?? 'ru-RU'
        this.defaultRegion =
            this.configService.get<string>('tmdb.defaultRegion') ?? 'RU'
    }

    async getMovieDb(): Promise<MovieDb> {
        return this.moviedb
    }

    async getTopRatedMovies(page: number = 1): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.movieTopRated({
                page,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch top rated movies`, error)
            throw new TmdbException(`Failed to fetch top rated movies`)
        }
    }

    async getTopRatedTvShows(page: number = 1): Promise<TvResultsResponse> {
        try {
            return await this.moviedb.tvTopRated({
                page,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch top rated tv shows`, error)
            throw new TmdbException(`Failed to fetch top rated tv shows`)
        }
    }

    async getTrendingMovies(): Promise<TrendingResponse> {
        try {
            return await this.moviedb.trending({
                media_type: 'movie',
                time_window: 'week',
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch trending movies`, error)
            throw new TmdbException(`Failed to fetch trending movies`)
        }
    }

    async getTrendingTvShows(): Promise<TrendingResponse> {
        try {
            return await this.moviedb.trending({
                media_type: 'tv',
                time_window: 'week',
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch trending tv shows`, error)
            throw new TmdbException(`Failed to fetch trending tv shows`)
        }
    }
    async getPopularMovies(page: number = 1): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.moviePopular({
                page,
                language: this.defaultLanguage,
                region: this.defaultRegion,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch popular movies`, error)
            throw new TmdbException(`Failed to fetch popular movies`)
        }
    }

    async getPopularTvShows(page: number = 1): Promise<TvResultsResponse> {
        try {
            return await this.moviedb.tvPopular({
                page,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch popular tvShows`, error)
            throw new TmdbException(`Failed to fetch popular tvShows`)
        }
    }

    async getUpcomingMovies(page: number = 1): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.upcomingMovies({
                page,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch upcoming movies`, error)
            throw new TmdbException(`Failed to fetch upcoming movies`)
        }
    }

    async getAiringTodayTvShows(page: number = 1): Promise<TvResultsResponse> {
        try {
            return await this.moviedb.tvAiringToday({
                page,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(`Failed to fetch airing tvShows`, error)
            throw new TmdbException(`Failed to fetch airing tvShows`)
        }
    }

    async searchMovies(
        query: string,
        page: number = 1,
    ): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.searchMovie({
                query,
                page,
                language: this.defaultLanguage,
                include_adult: false,
            })
        } catch (error) {
            this.logger.error(`Failed to search movies`, error)
            throw new TmdbException(`Failed to search movies`)
        }
    }

    async searchTvShows(query: string, page: number = 1) {
        try {
            return await this.moviedb.searchTv({
                query,
                page,
                language: this.defaultLanguage,
                include_adult: false,
            })
        } catch (error) {
            this.logger.error(
                `Failed to search TV shows with query "${query}":`,
                error,
            )
            throw new TmdbException(
                `Failed to search TV shows: ${error.message}`,
            )
        }
    }

    async getMovieDetails(
        tmdbId: number | string,
        language: string = this.defaultLanguage,
        appendToResponse: string = '',
    ): Promise<ExtendedMovieResponse> {
        try {
            const response = await this.moviedb.movieInfo({
                id: tmdbId,
                language,
                append_to_response: appendToResponse,
            })

            return response as ExtendedMovieResponse
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie details for ${tmdbId}`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie details for ${tmdbId}`,
            )
        }
    }

    async getTvShowDetails(
        tmdbId: number | string,
        language: string = this.defaultLanguage,
        appendToResponse: string = '',
    ): Promise<ExtendedShowResponse> {
        try {
            const response = await this.moviedb.tvInfo({
                id: tmdbId,
                language,
                append_to_response: appendToResponse,
            })

            return response as ExtendedShowResponse
        } catch (error) {
            this.logger.error(`Failed to fetch tv details for ${tmdbId}`, error)
            throw new TmdbException(`Failed to fetch tv details for ${tmdbId}`)
        }
    }

    async getMovieCredits(movieId: number | string): Promise<CreditsResponse> {
        try {
            return await this.moviedb.movieCredits({ id: movieId })
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie credits for ID ${movieId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie credits: ${error.message}`,
            )
        }
    }

    async getTvCredits(tvId: number | string): Promise<CreditsResponse> {
        try {
            return await this.moviedb.tvCredits({ id: tvId })
        } catch (error) {
            this.logger.error(
                `Failed to fetch TV credits for ID ${tvId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch TV credits: ${error.message}`,
            )
        }
    }

    async getMovieImages(
        tmdbId: number | string,
        language: string = 'en',
    ): Promise<MovieImagesResponse> {
        try {
            return await this.moviedb.movieImages({
                id: tmdbId,
                language,
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie images for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie images: ${error.message}`,
            )
        }
    }

    async getTvShowImages(
        tmdbId: number | string,
        language: string = 'en',
    ): Promise<TvImagesResponse> {
        try {
            return await this.moviedb.tvImages({
                id: tmdbId,
                language,
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch TV show images for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch TV show images: ${error.message}`,
            )
        }
    }

    async getMovieGenres() {
        try {
            const [enGenres, ruGenres] = await Promise.all([
                this.moviedb.genreMovieList({ language: 'en' }),
                this.moviedb.genreMovieList({ language: 'ru' }),
            ])

            return {
                en: enGenres,
                ru: ruGenres,
            }
        } catch (error) {
            this.logger.error('Failed to fetch movie genres:', error)
            throw new TmdbException('Failed to fetch movie genres')
        }
    }

    async getTvGenres() {
        try {
            const [enGenres, ruGenres] = await Promise.all([
                this.moviedb.genreTvList({ language: 'en' }),
                this.moviedb.genreTvList({ language: 'ru' }),
            ])

            return {
                en: enGenres,
                ru: ruGenres,
            }
        } catch (error) {
            this.logger.error('Failed to fetch TV genres:', error)
            throw new TmdbException('Failed to fetch TV genres')
        }
    }

    async getCountries(): Promise<CountriesResponse> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${this.moviedb.baseUrl}/configuration/countries?language=${this.defaultLanguage}`,
                    {
                        headers: this.configService.get('tmdb.headers'),
                    },
                ),
            )

            return response.data
        } catch (error) {
            this.logger.error('Failed to fetch countries:', error)
            throw new TmdbException('Failed to fetch countries')
        }
    }

    async getLanguages(): Promise<Language[]> {
        try {
            return await this.moviedb.languages()
        } catch (error) {
            this.logger.error('Failed to fetch languages:', error)
            throw new TmdbException('Failed to fetch languages')
        }
    }

    async getMovieRecommendations(
        tmdbId: number | string,
        page: number = 1,
    ): Promise<MovieRecommendationsResponse> {
        try {
            return await this.moviedb.movieRecommendations({
                id: tmdbId,
                page: String(page),
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie recommendations for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie recommendations: ${error.message}`,
            )
        }
    }

    async getTvShowRecommendations(
        tmdbId: number | string,
        page: number = 1,
    ): Promise<TvResultsResponse> {
        try {
            return await this.moviedb.tvRecommendations({
                id: tmdbId,
                page,
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch tvShow recommendations for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch tvShow recommendations: ${error.message}`,
            )
        }
    }

    async getSimilarMovies(
        tmdbId: number | string,
        page: number = 1,
    ): Promise<SimilarMovieResponse> {
        try {
            const result = await firstValueFrom(
                this.httpService.get(
                    `${this.moviedb.baseUrl}/movie/${tmdbId}/similar?language=${this.defaultLanguage}&page=${page}`,
                    {
                        headers: this.configService.get('tmdb.headers'),
                    },
                ),
            )

            return result.data
        } catch (error) {
            this.logger.error(
                `Failed to fetch similar movies for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch similar movies: ${error.message}`,
            )
        }
    }

    async getSimilarTvShows(
        tmdbId: number | string,
        page: number = 1,
    ): Promise<TvSimilarShowsResponse> {
        try {
            const result = await firstValueFrom(
                this.httpService.get(
                    `${this.moviedb.baseUrl}/tv/${tmdbId}/similar?language=${this.defaultLanguage}&page=${page}`,
                    {
                        headers: this.configService.get('tmdb.headers'),
                    },
                ),
            )

            return result.data
        } catch (error) {
            this.logger.error(
                `Failed to fetch similar tvShows for ID ${tmdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch similar tvShows: ${error.message}`,
            )
        }
    }

    async findByImdbId(imdbId: string): Promise<{
        movie_results: MovieResultsResponse['results']
        tv_results: TvResultsResponse['results']
    }> {
        try {
            return await this.moviedb.find({
                id: imdbId,
                external_source: ExternalId['ImdbId'],
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(
                `Failed to find title by IMDb ID ${imdbId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to find title by IMDb ID: ${error.message}`,
            )
        }
    }
}
