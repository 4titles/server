import { Injectable } from '@nestjs/common'
import { MovieResponse, MovieResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieMapper } from '../mappers/movie-mapper'
import { Movie } from '../models/movie.model'
import { BaseTitleSyncService } from './base-title-sync.service'
import { TitleType } from '../enums/title-type.enum'
import { DEFAULT_LIMIT } from './constants/query.constants'

@Injectable()
export class MovieService extends BaseTitleSyncService<Movie> {
    async getMovieByTmdbId(tmdbId: number): Promise<Movie> {
        return await this.titleEntityService.getMovieByTmdbId(tmdbId)
    }

    async getMoviesByCategory(
        limit: number = DEFAULT_LIMIT,
        category?: TitleCategory,
    ): Promise<Movie[]> {
        try {
            if (!category) {
                return this.titleEntityService.getAllMovies()
            }

            switch (category) {
                case TitleCategory.POPULAR:
                    await this.titleEntityService.getPopularMovies(limit)
                case TitleCategory.TOP_RATED:
                    await this.titleEntityService.getTopRatedMovies(limit)
                case TitleCategory.TRENDING:
                    await this.titleEntityService.getTrendingMovies(limit)
                case TitleCategory.SEARCH:
                    await this.titleEntityService.getSearchedMovies(limit)
                case TitleCategory.UPCOMING:
                    await this.titleEntityService.getUpComingMovies(limit)
                default:
                    throw new Error('Invalid title category')
            }
        } catch (error) {
            this.logger.error(`Failed to get movies: ${error.message}`)
            throw error
        }
    }

    async syncPopularMovies(): Promise<Movie[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.POPULAR,
            DEFAULT_LIMIT,
            (page) =>
                this.tmdbService
                    .getPopularMovies(page)
                    .then((res) => res.results),
        )
    }

    async syncTopRatedMovies(limit: number = DEFAULT_LIMIT): Promise<Movie[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.TOP_RATED,
            limit,
            (page) =>
                this.tmdbService
                    .getTopRatedMovies(page)
                    .then((res) => res.results),
        )
    }

    async syncUpComingMovies(limit: number = DEFAULT_LIMIT): Promise<Movie[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.UPCOMING,
            limit,
            (page) =>
                this.tmdbService
                    .getUpcomingMovies(page)
                    .then((res) => res.results),
        )
    }

    async syncTrendingMovies(): Promise<Movie[]> {
        return await this.syncTrendingTitles(TitleType.MOVIES)
    }

    async syncTitle(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<Movie> {
        return await this.syncTitleWithDetails(
            tmdbId,
            TitleType.MOVIES,
            category,
            this.tmdbService.getMovieDetails.bind(this.tmdbService),
            MovieMapper.mapMovieResponseToMovie,
        )
    }

    async searchMoviesOnTMDB(
        query: string,
        limit: number = DEFAULT_LIMIT,
    ): Promise<MovieResponse[]> {
        const { results } = await this.tmdbService.searchMovies(query)

        return Promise.all(
            results
                .slice(0, limit)
                .map(
                    async (result) =>
                        await this.syncTitle(result.id, TitleCategory.SEARCH),
                ),
        )
    }

    protected isValidTitle(item: MovieResult): boolean {
        return !!item.overview && !!item.title && !!item.poster_path
    }
}
