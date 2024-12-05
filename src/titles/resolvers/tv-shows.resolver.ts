import { Resolver, Query, Args, Int } from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { TvShow } from '../models/tv-show.model'
import { TvShowService } from '../services/tv-show.service'
import { TitleCategory } from '../enums/title-category.enum'

@Resolver(() => TvShow)
export class TvShowsResolver {
    private readonly logger = new Logger(TvShowsResolver.name)

    constructor(private readonly tvShowService: TvShowService) {}

    @Query(() => [TvShow])
    async tvShows(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTvShows(limit, category)
    }

    @Query(() => [TvShow])
    async popularTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getPopularTvShows(limit)
    }

    @Query(() => [TvShow])
    async topRatedTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTopRatedTvShows(limit)
    }

    @Query(() => [TvShow])
    async trendingTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTrendingTvShows(limit)
    }

    @Query(() => TvShow, { nullable: true })
    async tvShow(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return await this.tvShowService.getTvShowDetails(tmdbId)
    }

    @Query(() => [TvShow])
    async searchTvShows(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.searchTvShows(query, limit)
    }
}
