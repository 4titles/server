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
    ): Promise<{
        movieData: MovieResultsResponse | TrendingResponse
        tvData: TvResultsResponse | TrendingResponse
    }> {
        try {
            const [movieData, tvData] = await Promise.all([
                this.fetchMoviesByCategory(category, page),
                this.fetchTvShowsByCategory(category, page),
            ])

            return { movieData, tvData }
        } catch (error) {
            this.logger.error(
                `Failed to fetch category ${category} page ${page}:`,
                error,
            )

            return {
                movieData: { results: [], total_pages: 0 },
                tvData: { results: [], total_pages: 0 },
            }
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
        } catch (error) {
            this.logger.warn(
                `Failed to fetch recommendations for ${type} ${tmdbId}:`,
                error?.message,
            )
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
        } catch (error) {
            this.logger.warn(
                `Failed to fetch similar titles for ${type} ${tmdbId}:`,
                error?.message,
            )
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

            this.logger.warn(`No TMDB ID found for IMDB ID: ${imdbId}`)
            return null
        } catch (error) {
            this.logger.error(
                `Failed to find TMDB ID by IMDB ID ${imdbId}:`,
                error?.message,
            )
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

            if (!titleDetails) {
                this.logger.warn(
                    `fetchTitleDetails: No initial details found for ${type} ${tmdbId}`,
                )
                return null
            }

            const supportedLanguages = this.supportedLanguagesConfig
                .getAllLanguages()
                .map((lang) => lang.iso)
            const includeImageLanguages = [...supportedLanguages, 'null'].join(
                ',',
            )

            let images: TmdbImages
            try {
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
            } catch (imgError) {
                this.logger.warn(
                    `Failed to fetch images for ${type} ${tmdbId}: ${imgError.message}`,
                )
                images = { backdrops: [], posters: [], logos: [] }
            }

            const processedImages = this.processImages(
                images,
                supportedLanguages,
            )
            titleDetails.images = processedImages

            return titleDetails
        } catch (error) {
            this.logger.error(
                `Failed to fetch details for ${type} ${tmdbId}:`,
                error?.message,
            )
            return null
        }
    }

    private processImages(
        images: TmdbImages,
        supportedLanguages: string[],
    ): TmdbImages {
        if (!images) return { backdrops: [], posters: [], logos: [] }

        const processType = (items: any[]) => {
            if (!items) return []

            const langMap = new Map<string, any>()
            let firstGeneralItem: any = null

            for (const lang of supportedLanguages) {
                const item = items.find((i) => i.iso_639_1 === lang)
                if (item) langMap.set(lang, item)
            }

            items.forEach((item) => {
                if (item.iso_639_1 === null || item.iso_639_1 === undefined) {
                    if (!firstGeneralItem) {
                        firstGeneralItem = item
                    }
                }
            })

            const result = [
                ...supportedLanguages
                    .map((lang) => langMap.get(lang))
                    .filter(Boolean),
            ]

            if (
                firstGeneralItem &&
                !result.some((r) => r.file_path === firstGeneralItem.file_path)
            ) {
                result.push(firstGeneralItem)
            }

            return result
        }

        return {
            backdrops: processType(images.backdrops || []) || [],
            posters: processType(images.posters || []) || [],
            logos: processType(images.logos || []) || [],
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
                    this.logger.warn(
                        `Unsupported movie category fetch requested: ${category}`,
                    )
                    return {
                        results: [],
                        total_pages: 0,
                        page: 1,
                        total_results: 0,
                    }
            }
        } catch (error) {
            this.logger.error(
                `Failed fetching movies for category ${category}, page ${page}:`,
                error?.message,
            )
            return { results: [], total_pages: 0, page: 1, total_results: 0 }
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
                    this.logger.warn(
                        `Unsupported TV category fetch requested: ${category}`,
                    )
                    return {
                        results: [],
                        total_pages: 0,
                        page: 1,
                        total_results: 0,
                    }
            }
        } catch (error) {
            this.logger.error(
                `Failed fetching TV shows for category ${category}, page ${page}:`,
                error?.message,
            )
            return { results: [], total_pages: 0, page: 1, total_results: 0 }
        }
    }

    async getTitleChanges(
        tmdbId: string,
        type: TitleType,
        startDate: Date,
        endDate: Date = new Date(),
    ): Promise<{ key?: string; items?: any[] }[] | null> {
        try {
            let startDateString = startDate.toISOString().split('T')[0]
            const endDateString = endDate.toISOString().split('T')[0]

            if (startDate > endDate) {
                this.logger.warn(
                    `getTitleChanges: Start date ${startDateString} is after end date ${endDateString} for ${type} ${tmdbId}. Using end date as start date.`,
                )
                startDateString = endDateString
            }

            this.logger.debug(
                `Checking changes for ${type} ${tmdbId} from ${startDateString} to ${endDateString}`,
            )

            let changesResponse: TmdbTitleChangesResponse
            if (type === TitleType.MOVIE) {
                changesResponse = await this.tmdbService.getMovieChanges(
                    tmdbId,
                    startDateString,
                    endDateString,
                )
            } else {
                changesResponse = await this.tmdbService.getTvShowChanges(
                    tmdbId,
                    startDateString,
                    endDateString,
                )
            }

            const actualChanges =
                changesResponse &&
                'changes' in changesResponse &&
                Array.isArray(changesResponse.changes)
                    ? changesResponse.changes
                    : null

            const hasActualChanges = actualChanges?.some(
                (change) => change.items?.length > 0,
            )

            if (hasActualChanges) {
                this.logger.log(
                    `Detected changes for ${type} ${tmdbId} between ${startDateString} and ${endDateString}.`,
                )
                return actualChanges
            } else {
                this.logger.debug(
                    `No actual changes found for ${type} ${tmdbId} between ${startDateString} and ${endDateString}.`,
                )
                return null
            }
        } catch (error) {
            this.logger.error(
                `Failed to get changes for ${type} ${tmdbId}:`,
                error?.message,
            )
            return null
        }
    }
}
