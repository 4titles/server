import { Injectable } from '@nestjs/common'
import { TvResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShow } from '../models/tv-show.model'
import { BaseTitleSyncService } from './base-title-sync.service'
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
        return await this.titleMapper.mapSingleWithRelations<DbSeries>(
            await this.tvShowEntityService.getByImdbId(imdbId),
        )
    }

    async getTvShowByTmdbId(tmdbId: number): Promise<TvShow> {
        return await this.titleMapper.mapSingleWithRelations<DbSeries>(
            await this.tvShowEntityService.getByTmdbId(tmdbId),
        )
    }

    async getTvShowsByCategory(
        limit: number = DEFAULT_FETCH_LIMIT,
        category?: TitleCategory,
    ): Promise<TvShow[]> {
        let dbTvShows: DbSeries[] = []

        try {
            switch (category) {
                case undefined:
                    dbTvShows = await this.tvShowEntityService.getAll()
                    break
                case TitleCategory.POPULAR:
                    dbTvShows = await this.tvShowEntityService.getPopular(limit)
                    break
                case TitleCategory.TOP_RATED:
                    dbTvShows =
                        await this.tvShowEntityService.getTopRated(limit)
                    break
                case TitleCategory.TRENDING:
                    dbTvShows =
                        await this.tvShowEntityService.getTrending(limit)
                    break
                case TitleCategory.SEARCH:
                    dbTvShows =
                        await this.tvShowEntityService.getSearched(limit)
                    break
                case TitleCategory.AIRING:
                    dbTvShows = await this.tvShowEntityService.getAiring(limit)
                    break
                default:
                    throw new InvalidTitleCategoryException()
            }

            return await this.titleMapper.mapManyWithRelations<DbSeries>(
                dbTvShows,
            )
        } catch (error) {
            throw new TitleFetchException(
                `Failed to fetch tvShows: ${error.message}`,
            )
        }
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
            this.tvShowMapper.mapShowResponseToTvShow.bind(this.tvShowMapper),
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
