import { DbMovie } from '@/modules/infrastructure/drizzle/schema/movies.schema'
import { Injectable } from '@nestjs/common'
import { MovieResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import { InvalidTitleCategoryException } from '../exceptions/invalid-title-category.exception'
import { TitleFetchException } from '../exceptions/title-fetch.exception'
import { Movie } from '../models/movie.model'
import { BaseTitleSyncService } from './base-title-sync.service'
import {
    DEFAULT_FETCH_LIMIT,
    DEFAULT_SEARCH_LIMIT,
} from './constants/query.constants'

@Injectable()
export class MovieService extends BaseTitleSyncService<Movie> {
    async getMovieByImdbId(imdbId: string): Promise<Movie> {
        const dbMovie = await this.movieEntityService.getByImdbId(imdbId)
        return this.movieMapper.mapFromDatabase(dbMovie, {
            category: dbMovie.category,
            includeRelations: true,
        })
    }

    async getMovieByTmdbId(tmdbId: number): Promise<Movie> {
        const dbMovie = await this.movieEntityService.getByTmdbId(tmdbId)
        return this.movieMapper.mapFromDatabase(dbMovie, {
            category: dbMovie.category,
            includeRelations: true,
        })
    }

    async getMoviesByCategory(
        limit: number = DEFAULT_FETCH_LIMIT,
        category?: TitleCategory,
    ): Promise<Movie[]> {
        try {
            let dbMovies: DbMovie[]

            if (!category) {
                dbMovies = await this.movieEntityService.getAll(limit)
            } else {
                const fetcher = this.getCategoryFetcher(category)
                dbMovies = await fetcher(limit)
            }

            return this.movieMapper.mapManyWithRelations(dbMovies)
        } catch (error) {
            throw new TitleFetchException(
                `Failed to fetch movies: ${error.message}`,
            )
        }
    }

    private getCategoryFetcher(
        category: TitleCategory,
    ): (limit: number) => Promise<DbMovie[]> {
        const fetchers = {
            [TitleCategory.POPULAR]: this.movieEntityService.getPopular.bind(
                this.movieEntityService,
            ),
            [TitleCategory.TOP_RATED]: this.movieEntityService.getTopRated.bind(
                this.movieEntityService,
            ),
            [TitleCategory.TRENDING]: this.movieEntityService.getTrending.bind(
                this.movieEntityService,
            ),
            [TitleCategory.SEARCH]: this.movieEntityService.getSearched.bind(
                this.movieEntityService,
            ),
            [TitleCategory.UPCOMING]: this.movieEntityService.getUpcoming.bind(
                this.movieEntityService,
            ),
        }

        const fetcher = fetchers[category]
        if (!fetcher) {
            throw new InvalidTitleCategoryException()
        }

        return fetcher
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
            this.movieMapper.mapToEntity.bind(this.movieMapper),
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
