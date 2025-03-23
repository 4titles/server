import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    MovieResultsResponse,
    TrendingResponse,
    TvResultsResponse,
} from 'moviedb-promise'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TmdbService } from '../../modules/tmdb/tmdb.service'
import {
    ExtendedMovieResponse,
    ExtendedShowResponse,
    TmdbTitleRecommendationsResponse,
    TmdbTitleSimilarResponse,
} from '../../modules/tmdb/types/tmdb.interface'

interface CategoryResponse {
    movieData: MovieResultsResponse | TrendingResponse
    tvData: TvResultsResponse | TrendingResponse
}

@Injectable()
export class TitleFetcherService {
    private readonly TMDB_ADDITIONAL_FIELDS: string
    private readonly defaultLanguage: string

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly configService: ConfigService,
    ) {
        this.TMDB_ADDITIONAL_FIELDS = [
            'images',
            'recommendations',
            'translations',
            'external_ids',
            'keywords',
            'credits',
            'similar',
            'alternative_titles',
        ].join(',')

        this.defaultLanguage = this.configService.get<string>(
            'tmdb.defaultLanguage',
            'ru-RU',
        )
    }

    async fetchByCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<CategoryResponse> {
        try {
            const [movieData, tvData] = await Promise.all([
                this.fetchMoviesByCategory(category, page),
                this.fetchTvShowsByCategory(category, page),
            ])

            return { movieData, tvData }
        } catch (error) {
            throw error
        }
    }

    async fetchTitleDetails(
        tmdbId: string,
        type: TitleType,
    ): Promise<ExtendedMovieResponse | ExtendedShowResponse> {
        try {
            if (type === TitleType.MOVIE) {
                return await this.tmdbService.getMovieDetails(
                    tmdbId,
                    this.defaultLanguage,
                    this.TMDB_ADDITIONAL_FIELDS,
                )
            } else {
                return await this.tmdbService.getTvShowDetails(
                    tmdbId,
                    this.defaultLanguage,
                    this.TMDB_ADDITIONAL_FIELDS,
                )
            }
        } catch {
            return null
        }
    }

    async fetchRecommendations(
        tmdbId: number,
        type: TitleType,
        page: number,
    ): Promise<TmdbTitleRecommendationsResponse> {
        try {
            if (type === TitleType.MOVIE) {
                return await this.tmdbService.getMovieRecommendations(
                    tmdbId,
                    page,
                )
            } else {
                return await this.tmdbService.getTvShowRecommendations(
                    tmdbId,
                    page,
                )
            }
        } catch {
            return null
        }
    }

    async fetchSimilar(
        tmdbId: number,
        type: TitleType,
        page: number,
    ): Promise<TmdbTitleSimilarResponse> {
        try {
            if (type === TitleType.MOVIE) {
                return await this.tmdbService.getSimilarMovies(tmdbId, page)
            } else {
                return await this.tmdbService.getSimilarTvShows(tmdbId, page)
            }
        } catch {
            return null
        }
    }

    async findByImdbId(imdbId: string): Promise<{
        type: TitleType
        tmdbId: string
    } | null> {
        try {
            const result = await this.tmdbService.findByImdbId(imdbId)

            if (result.movie_results?.length > 0) {
                return {
                    type: TitleType.MOVIE,
                    tmdbId: String(result.movie_results[0].id),
                }
            }

            if (result.tv_results?.length > 0) {
                return {
                    type: TitleType.TV,
                    tmdbId: String(result.tv_results[0].id),
                }
            }

            return null
        } catch {
            return null
        }
    }

    private async fetchMoviesByCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<MovieResultsResponse | TrendingResponse> {
        try {
            switch (category) {
                case TitleCategory.POPULAR:
                    return await this.tmdbService.getPopularMovies(page)
                case TitleCategory.TOP_RATED:
                    return await this.tmdbService.getTopRatedMovies(page)
                case TitleCategory.TRENDING:
                    return await this.tmdbService.getTrendingMovies()
                case TitleCategory.UPCOMING:
                    return await this.tmdbService.getUpcomingMovies(page)
                default:
                    return { results: [], total_pages: 0 }
            }
        } catch {
            return { results: [], total_pages: 0 }
        }
    }

    private async fetchTvShowsByCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<TvResultsResponse | TrendingResponse> {
        try {
            switch (category) {
                case TitleCategory.POPULAR:
                    return await this.tmdbService.getPopularTvShows(page)
                case TitleCategory.TOP_RATED:
                    return await this.tmdbService.getTopRatedTvShows(page)
                case TitleCategory.TRENDING:
                    return await this.tmdbService.getTrendingTvShows()
                case TitleCategory.AIRING:
                    return await this.tmdbService.getAiringTodayTvShows(page)
                default:
                    return { results: [], total_pages: 0 }
            }
        } catch {
            return { results: [], total_pages: 0 }
        }
    }
}
