import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { TitleCategory } from '../enums/title-category.enum'
import { TvShow } from '../models/tv-show.model'
import { TvShowService } from '../services/tv-show.service'
@Resolver(() => TvShow)
export class TvShowsResolver {
    constructor(private readonly tvShowService: TvShowService) {}

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description:
            'Get a list of TV shows with an optional category filter and limit',
    })
    async tvShows(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.getTvShowsByCategory(limit, category)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description: 'Get a list of popular TV shows with an optional limit',
    })
    async popularTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.POPULAR,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description: 'Get a list of top-rated TV shows with an optional limit',
    })
    async topRatedTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.TOP_RATED,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description: 'Get a list of trending TV shows with an optional limit',
    })
    async trendingTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.TRENDING,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description: 'Get a list of an airing TV shows with an optional limit',
    })
    async airingTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.AIRING,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => TvShow, {
        nullable: true,
        description: 'Get a TV show by TMDB ID',
    })
    async tvShow(
        @Args('tmdbId', { type: () => Int }) tmdbId: number,
    ): Promise<TvShow> {
        return await this.tvShowService.getTvShowByTmdbId(tmdbId)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TvShow], {
        description: 'Search for TV shows by query with an optional limit',
    })
    async searchTvShows(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<TvShow[]> {
        return await this.tvShowService.searchTvShowsOnTMDB(query, limit)
    }
}
