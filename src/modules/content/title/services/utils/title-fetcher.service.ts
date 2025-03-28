import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    MovieResultsResponse,
    TrendingResponse,
    TvResultsResponse,
} from 'moviedb-promise'
import { TitleSupportedLanguagesConfig } from '../../config/title-supported-languages.config'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TmdbService } from '../../modules/tmdb/tmdb.service'
import {
    TmdbImages,
    TmdbTitleChangesResponse,
    TmdbTitleExtendedResponse,
    TmdbTitleRecommendationsResponse,
    TmdbTitleSimilarResponse,
} from '../../modules/tmdb/types/tmdb.interface'

export interface CategoryResponse {
    movieData: MovieResultsResponse | TrendingResponse
    tvData: TvResultsResponse | TrendingResponse
}

export interface CategoryResponseWithLimit extends CategoryResponse {
    totalPages: number
    hasMore: boolean
}

@Injectable()
export class TitleFetcherService {
    private readonly logger = new Logger(TitleFetcherService.name)
    private readonly TMDB_ADDITIONAL_FIELDS: string
    private readonly defaultLanguage: string

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly configService: ConfigService,
        private readonly supportedLanguagesConfig: TitleSupportedLanguagesConfig,
    ) {
        this.TMDB_ADDITIONAL_FIELDS = [
            'images',
            'translations',
            'external_ids',
            'keywords',
            'credits',
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

    async fetchTitleDetails(
        tmdbId: string | number,
        type: TitleType,
    ): Promise<TmdbTitleExtendedResponse> {
        try {
            let titleDetails: TmdbTitleExtendedResponse

            if (type === TitleType.MOVIE) {
                titleDetails = await this.tmdbService.getMovieDetails(
                    tmdbId,
                    this.defaultLanguage,
                    this.TMDB_ADDITIONAL_FIELDS,
                )
            } else {
                titleDetails = await this.tmdbService.getTvShowDetails(
                    tmdbId,
                    this.defaultLanguage,
                    this.TMDB_ADDITIONAL_FIELDS,
                )
            }

            const supportedLanguages = this.supportedLanguagesConfig
                .getAllLanguages()
                .map((lang) => lang.iso)
            const includeImageLanguages = [...supportedLanguages, 'null'].join(
                ',',
            )

            let images: TmdbImages
            if (type === TitleType.MOVIE) {
                images = await this.tmdbService.getMovieImages(
                    tmdbId,
                    includeImageLanguages,
                )
            } else {
                images = await this.tmdbService.getTvShowImages(
                    tmdbId,
                    includeImageLanguages,
                )
            }

            const processedImages = this.processImages(
                images,
                supportedLanguages,
            )
            titleDetails.images = processedImages

            return titleDetails
        } catch {
            return null
        }
    }

    private processImages(
        images: TmdbImages,
        supportedLanguages: string[],
    ): TmdbImages {
        const processType = (items: any[]) => {
            const langMap = new Map<string, any>()
            const generalItems: any[] = []

            for (const lang of supportedLanguages) {
                const item = items.find((i) => i.iso_639_1 === lang)
                if (item) langMap.set(lang, item)
            }

            items.forEach((item) => {
                if (!item.iso_639_1 && !langMap.has('null')) {
                    generalItems.push(item)
                }
            })

            return [
                ...supportedLanguages
                    .map((lang) => langMap.get(lang))
                    .filter(Boolean),
                ...generalItems,
            ]
        }

        return {
            backdrops: processType(images.backdrops || []),
            posters: processType(images.posters || []),
            logos: processType(images.logos || []),
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

    async getTitleChanges(
        tmdbId: string,
        type: TitleType,
    ): Promise<TmdbTitleChangesResponse | null> {
        try {
            const endDate = new Date()
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 1)

            if (type === TitleType.MOVIE) {
                return await this.tmdbService.getMovieChanges(
                    tmdbId,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0],
                )
            } else {
                return await this.tmdbService.getTvShowChanges(
                    tmdbId,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0],
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to get changes for title ${tmdbId}:`,
                error,
            )

            return null
        }
    }
}
