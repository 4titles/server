import { Injectable } from '@nestjs/common'
import { BaseTitleSyncService } from './base-title-sync.service'
import { TvResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShow } from '../models/tv-show.model'
import { TitleType } from '../enums/title-type.enum'
import {
    DEFAULT_FETCH_LIMIT,
    DEFAULT_SEARCH_LIMIT,
} from './constants/query.constants'
import { DbSeries } from '@/modules/drizzle/schema/series.schema'
import { InvalidTitleCategoryException } from '../exceptions/invalid-title-category.exception'
import { TitleFetchException } from '../exceptions/title-fetch.exception'

@Injectable()
export class TvShowService extends BaseTitleSyncService<TvShow> {
    async getTvShowByImdbId(imdbId: string): Promise<TvShow> {
        const dbTvShow = await this.tvShowEntityService.getByImdbId(imdbId)
        return this.tvShowMapper.mapFromDatabase(dbTvShow, {
            category: dbTvShow.category,
            includeRelations: true,
        })
    }

    async getTvShowByTmdbId(tmdbId: number): Promise<TvShow> {
        const dbTvShow = await this.tvShowEntityService.getByTmdbId(tmdbId)
        return this.tvShowMapper.mapFromDatabase(dbTvShow, {
            category: dbTvShow.category,
            includeRelations: true,
        })
    }

    async getTvShowsByCategory(
        limit: number = DEFAULT_FETCH_LIMIT,
        category?: TitleCategory,
    ): Promise<TvShow[]> {
        try {
            let dbTvShows: DbSeries[]

            if (!category) {
                dbTvShows = await this.tvShowEntityService.getAll(limit)
            } else {
                const fetcher = this.getCategoryFetcher(category)
                dbTvShows = await fetcher(limit)
            }

            return this.tvShowMapper.mapManyWithRelations(dbTvShows)
        } catch (error) {
            throw new TitleFetchException(
                `Failed to fetch movies: ${error.message}`,
            )
        }
    }

    private getCategoryFetcher(
        category: TitleCategory,
    ): (limit: number) => Promise<DbSeries[]> {
        const fetchers = {
            [TitleCategory.POPULAR]: this.tvShowEntityService.getPopular.bind(
                this.tvShowEntityService,
            ),
            [TitleCategory.TOP_RATED]:
                this.tvShowEntityService.getTopRated.bind(
                    this.tvShowEntityService,
                ),
            [TitleCategory.TRENDING]: this.tvShowEntityService.getTrending.bind(
                this.tvShowEntityService,
            ),
            [TitleCategory.SEARCH]: this.tvShowEntityService.getSearched.bind(
                this.tvShowEntityService,
            ),
            [TitleCategory.AIRING]: this.tvShowEntityService.getAiring.bind(
                this.tvShowEntityService,
            ),
        }

        const fetcher = fetchers[category]
        if (!fetcher) {
            throw new InvalidTitleCategoryException()
        }

        return fetcher
    }

    async syncPopularTvShows(): Promise<TvShow[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.POPULAR,
            DEFAULT_FETCH_LIMIT,
            (page) =>
                this.tmdbService
                    .getPopularTvShows(page)
                    .then((res) => res.results),
        )
    }

    async syncTopRatedTvShows(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<TvShow[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.TOP_RATED,
            limit,
            (page) =>
                this.tmdbService
                    .getTopRatedTvShows(page)
                    .then((res) => res.results),
        )
    }

    async syncAiringTvShows(
        limit: number = DEFAULT_FETCH_LIMIT,
    ): Promise<TvShow[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.AIRING,
            limit,
            (page) =>
                this.tmdbService
                    .getAiringTodayTvShows(page)
                    .then((res) => res.results),
        )
    }

    async syncTrendingTvShows(): Promise<TvShow[]> {
        return await this.syncTrendingTitles(TitleType.TV_SHOWS)
    }

    async syncTitle(
        tmdbId: number,
        category: TitleCategory = TitleCategory.POPULAR,
    ): Promise<TvShow> {
        return await this.syncTitleWithDetails(
            tmdbId,
            TitleType.TV_SHOWS,
            category,
            this.tmdbService.getTvDetails.bind(this.tmdbService),
            this.tvShowMapper.mapToEntity.bind(this.tvShowMapper),
        )
    }

    async searchTvShowsOnTMDB(
        query: string,
        limit: number = DEFAULT_SEARCH_LIMIT,
    ): Promise<TvShow[]> {
        const { results } = await this.tmdbService.searchTvShows(query)

        return Promise.all(
            results
                .slice(0, limit)
                .map((result) =>
                    this.syncTitle(result.id, TitleCategory.SEARCH),
                ),
        )
    }

    protected isValidTitle(item: TvResult): boolean {
        return !!item.overview && !!item.name && !!item.poster_path
    }
}
