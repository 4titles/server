import { Injectable, Logger } from '@nestjs/common'
import { MovieResponse, ShowResponse } from 'moviedb-promise'
import { TitleType } from '../enums/title-type.enum'
import { MovieService } from './movie.service'
import { TvShowService } from './tv-show.service'
import { SyncResult } from '../models/sync-result.model'
import { FullSyncResult } from '../models/full-sync-result.model'
import { DEFAULT_FETCH_LIMIT } from './constants/query.constants'
import { Title, TitleResponse } from '../types/title.type'

@Injectable()
export class TitlesService {
    private readonly logger = new Logger(TitlesService.name)

    constructor(
        private readonly movieService: MovieService,
        private readonly tvShowService: TvShowService,
    ) {}

    async getAllTitles(limit: number = DEFAULT_FETCH_LIMIT): Promise<Title[]> {
        const [movies, tvShows] = await Promise.all([
            this.movieService.getMoviesByCategory(limit),
            this.tvShowService.getTvShowsByCategory(limit),
        ])

        return [...movies, ...tvShows]
    }

    async syncAllContent(): Promise<FullSyncResult> {
        try {
            const [
                popularMovies,
                popularTvShows,
                trendingMovies,
                trendingTvShows,
                topRatedMovies,
                topRatedTvShows,
                upcomingMovies,
                airingTvShows,
            ] = await Promise.all([
                this.movieService.syncPopularMovies(),
                this.tvShowService.syncPopularTvShows(),
                this.movieService.syncTrendingMovies(),
                this.tvShowService.syncTrendingTvShows(),
                this.movieService.syncTopRatedMovies(),
                this.tvShowService.syncTopRatedTvShows(),
                this.movieService.syncUpComingMovies(),
                this.tvShowService.syncAiringTvShows(),
            ])

            return {
                popularMoviesCount: popularMovies.length,
                popularTvShowsCount: popularTvShows.length,
                trendingMoviesCount: trendingMovies.length,
                trendingTvShowsCount: trendingTvShows.length,
                topRatedMoviesCount: topRatedMovies.length,
                topRatedTvShowsCount: topRatedTvShows.length,
                upcomingMoviesCount: upcomingMovies.length,
                airingTvShowsCount: airingTvShows.length,
            }
        } catch (error) {
            this.logger.error('Failed to sync all content:', error)
            throw error
        }
    }

    async syncTitle(tmdbId: number, type?: TitleType): Promise<TitleResponse> {
        try {
            switch (type) {
                case TitleType.MOVIES:
                    return this.movieService.syncTitle(tmdbId)
                case TitleType.TV_SHOWS:
                    return this.tvShowService.syncTitle(tmdbId)
                default:
                    throw new Error('Invalid title type')
            }
        } catch (error) {
            this.logger.error(
                `Failed to sync title with TMDB ID ${tmdbId}:`,
                error,
            )
            throw error
        }
    }

    async syncPopularTitles(
        type: TitleType = TitleType.ALL,
    ): Promise<SyncResult> {
        try {
            let movies: MovieResponse[] = []
            let tvShows: ShowResponse[] = []

            switch (type) {
                case TitleType.MOVIES:
                    movies = await this.movieService.syncPopularMovies()
                    break
                case TitleType.TV_SHOWS:
                    tvShows = await this.tvShowService.syncPopularTvShows()
                    break
                case TitleType.ALL:
                    ;[movies, tvShows] = await Promise.all([
                        this.movieService.syncPopularMovies(),
                        this.tvShowService.syncPopularTvShows(),
                    ])
                    break
                default:
                    throw new Error('Invalid title type')
            }

            return {
                moviesCount: movies.length,
                tvShowsCount: tvShows.length,
            }
        } catch (error) {
            this.logger.error(`Failed to sync popular titles:`, error)
            throw error
        }
    }

    async syncTrendingTitles(
        type: TitleType = TitleType.ALL,
    ): Promise<SyncResult> {
        try {
            let movies: MovieResponse[] = []
            let tvShows: ShowResponse[] = []

            switch (type) {
                case TitleType.MOVIES:
                    movies = await this.movieService.syncTrendingMovies()
                    break
                case TitleType.TV_SHOWS:
                    tvShows = await this.tvShowService.syncTrendingTvShows()
                    break
                case TitleType.ALL:
                    ;[movies, tvShows] = await Promise.all([
                        this.movieService.syncTrendingMovies(),
                        this.tvShowService.syncTrendingTvShows(),
                    ])
                    break
                default:
                    throw new Error('Invalid title type')
            }

            return {
                moviesCount: movies.length,
                tvShowsCount: tvShows.length,
            }
        } catch (error) {
            this.logger.error(`Failed to sync trending titles:`, error)
            throw error
        }
    }

    async syncTopRatedTitles(
        type: TitleType = TitleType.ALL,
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<SyncResult> {
        try {
            let movies: MovieResponse[] = []
            let tvShows: ShowResponse[] = []

            switch (type) {
                case TitleType.MOVIES:
                    movies = await this.movieService.syncTopRatedMovies(limit)
                    break
                case TitleType.TV_SHOWS:
                    tvShows =
                        await this.tvShowService.syncTopRatedTvShows(limit)
                    break
                case TitleType.ALL:
                    ;[movies, tvShows] = await Promise.all([
                        this.movieService.syncTopRatedMovies(limit),
                        this.tvShowService.syncTopRatedTvShows(limit),
                    ])
                    break
                default:
                    throw new Error('Invalid title type')
            }

            return {
                moviesCount: movies.length,
                tvShowsCount: tvShows.length,
            }
        } catch (error) {
            this.logger.error(`Failed to sync top rated titles:`, error)
            throw error
        }
    }

    async syncUpcomingTitles(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<SyncResult> {
        try {
            const movies = await this.movieService.syncUpComingMovies(limit)
            return {
                moviesCount: movies.length,
                tvShowsCount: 0,
            }
        } catch (error) {
            this.logger.error(`Failed to sync upcoming titles:`, error)
            throw error
        }
    }

    async syncAiringTitles(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<SyncResult> {
        try {
            const tvShows = await this.tvShowService.syncAiringTvShows(limit)
            return {
                tvShowsCount: tvShows.length,
                moviesCount: 0,
            }
        } catch (error) {
            this.logger.error(`Failed to sync airing titles:`, error)
            throw error
        }
    }
}
