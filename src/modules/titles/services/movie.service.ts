import { Injectable } from '@nestjs/common'
import { MovieResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { Movie } from '../models/movie.model'
import { BaseTitleSyncService } from './base-title-sync.service'
import { TitleType } from '../enums/title-type.enum'
import {
    DEFAULT_FETCH_LIMIT,
    DEFAULT_SEARCH_LIMIT,
} from './constants/query.constants'
import { DbMovie } from '@/modules/drizzle/schema/movies.schema'
import { InvalidTitleCategoryException } from '../exceptions/invalid-title-category.exception'
import { TitleFetchException } from '../exceptions/title-fetch.exception'

@Injectable()
export class MovieService extends BaseTitleSyncService<Movie> {
    async getMovieByImdbId(imdbId: string): Promise<Movie> {
        return this.titleMapper.mapSingleWithRelations<DbMovie>(
            await this.movieEntityService.getByImdbId(imdbId),
        )
    }

    async getMovieByTmdbId(tmdbId: number): Promise<Movie> {
        return this.titleMapper.mapSingleWithRelations<DbMovie>(
            await this.movieEntityService.getByTmdbId(tmdbId),
        )
    }

    async getMoviesByCategory(
        limit: number = DEFAULT_FETCH_LIMIT,
        category?: TitleCategory,
    ): Promise<Movie[]> {
        let dbMovies: DbMovie[] = []

        try {
            switch (category) {
                case undefined:
                    dbMovies = await this.movieEntityService.getAll()
                    break
                case TitleCategory.POPULAR:
                    dbMovies = await this.movieEntityService.getPopular(limit)
                    break
                case TitleCategory.TOP_RATED:
                    dbMovies = await this.movieEntityService.getTopRated(limit)
                    break
                case TitleCategory.TRENDING:
                    dbMovies = await this.movieEntityService.getTrending(limit)
                    break
                case TitleCategory.SEARCH:
                    dbMovies = await this.movieEntityService.getSearched(limit)
                    break
                case TitleCategory.UPCOMING:
                    dbMovies = await this.movieEntityService.getUpcoming(limit)
                    break
                default:
                    throw new InvalidTitleCategoryException()
            }

            return this.titleMapper.mapManyWithRelations<DbMovie>(dbMovies)
        } catch (error) {
            throw new TitleFetchException(
                `Failed to fetch movies: ${error.message}`,
            )
        }
    }

    async syncPopularMovies(): Promise<Movie[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.POPULAR,
            DEFAULT_FETCH_LIMIT,
            (page) =>
                this.tmdbService
                    .getPopularMovies(page)
                    .then((res) => res.results),
        )
    }

    async syncTopRatedMovies(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<Movie[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.TOP_RATED,
            limit,
            (page) =>
                this.tmdbService
                    .getTopRatedMovies(page)
                    .then((res) => res.results),
        )
    }

    async syncUpComingMovies(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<Movie[]> {
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
            this.movieMapper.mapMovieResponseToMovie.bind(this.movieMapper),
        )
    }

    async searchMoviesOnTMDB(
        query: string,
        limit: number = DEFAULT_SEARCH_LIMIT,
    ): Promise<Movie[]> {
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
