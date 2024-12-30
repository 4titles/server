import {
    Resolver,
    Query,
    Args,
    Int,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { TvShow } from '../models/tv-show.model'
import { TvShowService } from '../services/tv-show.service'
import { TitleCategory } from '../enums/title-category.enum'
import { LocationsService } from 'src/locations/services/locations.service'
import { FilmingLocation } from 'src/locations/models/filming-location.model'

@Resolver(() => TvShow)
export class TvShowsResolver {
    constructor(
        private readonly tvShowService: TvShowService,
        private readonly locationsService: LocationsService,
    ) {}

    @Query(() => [TvShow], {
        description:
            'Get a list of TV shows with an optional category filter and limit',
    })
    async tvShows(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTvShowsByCategory(limit, category)
    }

    @Query(() => [TvShow], {
        description: 'Get a list of popular TV shows with an optional limit',
    })
    async popularTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.POPULAR,
        )
    }

    @Query(() => [TvShow], {
        description: 'Get a list of top-rated TV shows with an optional limit',
    })
    async topRatedTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.TOP_RATED,
        )
    }

    @Query(() => [TvShow], {
        description: 'Get a list of trending TV shows with an optional limit',
    })
    async trendingTvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.getTvShowsByCategory(
            limit,
            TitleCategory.TRENDING,
        )
    }

    @Query(() => TvShow, {
        nullable: true,
        description: 'Get a TV show by TMDB ID',
    })
    async tvShow(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return await this.tvShowService.getTvShowByTmdbId(tmdbId)
    }

    @Query(() => [TvShow], {
        description: 'Search for TV shows by query with an optional limit',
    })
    async searchTvShows(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.tvShowService.searchTvShowsOnTMDB(query, limit)
    }

    @ResolveField('filmingLocations', () => [FilmingLocation], {
        description: 'Get filming locations for the TV show',
    })
    async getFilmingLocations(@Parent() tvShow: TvShow) {
        if (!tvShow.filmingLocations && tvShow.imdbId) {
            return this.locationsService.getLocationsForTitle(
                tvShow.imdbId,
                false,
            )
        }
        return tvShow.filmingLocations || []
    }
}
