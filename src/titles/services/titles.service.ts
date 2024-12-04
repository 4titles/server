import { Injectable, Logger } from '@nestjs/common'
import { MovieResponse, ShowResponse } from 'moviedb-promise'
import { TitleType } from '../enums/title-type.enum'
import { MovieService } from './movie.service'
import { TvShowService } from './tv-show.service'
import { SyncResult } from '../models/sync-result.model'
import { FullSyncResult } from '../models/full-sync-result.model'

@Injectable()
export class TitlesService {
    private readonly logger = new Logger(TitlesService.name)
    private readonly CACHE_TTL = 24 * 60 * 60 // 24 hours

    constructor(
        private readonly movieService: MovieService,
        private readonly tvShowService: TvShowService,
    ) {}

    async syncTitle(
        tmdbId: number,
        type?: TitleType,
    ): Promise<MovieResponse | ShowResponse> {
        try {
            switch (type) {
                case TitleType.MOVIES:
                    return this.movieService.syncMovie(tmdbId)
                case TitleType.TV_SHOWS:
                    return this.tvShowService.syncTvShow(tmdbId)
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
    ): Promise<SyncResult> {
        try {
            let movies: MovieResponse[] = []
            let tvShows: ShowResponse[] = []

            switch (type) {
                case TitleType.MOVIES:
                    movies = await this.movieService.syncTopRatedMovies()
                    break
                case TitleType.TV_SHOWS:
                    tvShows = await this.tvShowService.syncTopRatedTvShows()
                    break
                case TitleType.ALL:
                    ;[movies, tvShows] = await Promise.all([
                        this.movieService.syncTopRatedMovies(),
                        this.tvShowService.syncTopRatedTvShows(),
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

    async syncAllContent(): Promise<FullSyncResult> {
        try {
            const [
                popularMovies,
                popularTvShows,
                trendingMovies,
                trendingTvShows,
            ] = await Promise.all([
                this.movieService.syncPopularMovies(),
                this.tvShowService.syncPopularTvShows(),
                this.movieService.syncTrendingMovies(),
                this.tvShowService.syncTrendingTvShows(),
                this.movieService.syncTopRatedMovies(),
                this.tvShowService.syncTopRatedTvShows(),
            ])

            return {
                popularMoviesCount: popularMovies.length,
                popularTvShowsCount: popularTvShows.length,
                trendingMoviesCount: trendingMovies.length,
                trendingTvShowsCount: trendingTvShows.length,
            }
        } catch (error) {
            this.logger.error('Failed to sync all content:', error)
            throw error
        }
    }
}
