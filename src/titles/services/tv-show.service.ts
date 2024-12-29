import { Injectable } from '@nestjs/common'
import { ShowResponse, TvResult } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShowMapper } from '../mappers/tv-show.mapper'
import { TvShow } from '../models/tv-show.model'
import { BaseTitleSyncService } from './base-title-sync.service'
import { TitleType } from '../enums/title-type.enum'
import { DEFAULT_LIMIT } from './constants/query.constants'

@Injectable()
export class TvShowService extends BaseTitleSyncService<TvShow> {
    async getTvShowsByCategory(
        limit: number = DEFAULT_LIMIT,
        category?: TitleCategory,
    ): Promise<TvShow[]> {
        try {
            if (!category) {
                return this.titleEntityService.getAllTvShows()
            }

            switch (category) {
                case TitleCategory.POPULAR:
                    await this.titleEntityService.getPopularTvShows(limit)
                case TitleCategory.TOP_RATED:
                    await this.titleEntityService.getTopRatedTvShows(limit)
                case TitleCategory.TRENDING:
                    await this.titleEntityService.getTrendingTvShows(limit)
                default:
                    throw new Error('Invalid category')
            }
        } catch (error) {
            this.logger.error('Failed to get TV shows:', error)
            throw error
        }
    }

    async getByTmdbId(tmdbId: number): Promise<TvShow> {
        return await this.titleEntityService.getTvShowByTmdbId(tmdbId)
    }

    async syncPopularTvShows(): Promise<TvShow[]> {
        return await this.syncTitlesByCategory(
            TitleCategory.POPULAR,
            DEFAULT_LIMIT,
            (page) =>
                this.tmdbService
                    .getPopularTvShows(page)
                    .then((res) => res.results),
        )
    }

    async syncTopRatedTvShows(
        limit: number = DEFAULT_LIMIT,
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

    async syncTrendingTvShows(): Promise<ShowResponse[]> {
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
            TvShowMapper.mapShowResponseToTvShow,
        )
    }

    async searchTvShowsOnTMDB(
        query: string,
        limit: number = DEFAULT_LIMIT,
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
