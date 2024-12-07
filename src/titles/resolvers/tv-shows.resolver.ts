import {
    Resolver,
    Query,
    Args,
    Int,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { TvShow } from '../models/tv-show.model'
import { TvShowService } from '../services/tv-show.service'
import { TitleCategory } from '../enums/title-category.enum'
import { LocationsService } from 'src/locations/services/locations.service'

@Resolver(() => TvShow)
export class TvShowsResolver {
    private readonly logger = new Logger(TvShowsResolver.name)

    constructor(
        private readonly tvShowService: TvShowService,
        private readonly locationsService: LocationsService,
    ) {}

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

    @ResolveField('filmingLocations')
    async getFilmingLocations(@Parent() tvShow: TvShow) {
        try {
            if (!tvShow.imdbId) {
                return []
            }

            let locations = await this.locationsService.getLocationsForTitle(
                tvShow.imdbId,
                false,
            )

            if (locations.length === 0) {
                this.logger.log(
                    `No locations found for TV show ${tvShow.imdbId}, fetching from IMDB...`,
                )

                const success =
                    await this.locationsService.syncLocationsForTitle(
                        tvShow.imdbId,
                    )

                if (success) {
                    locations =
                        await this.locationsService.getLocationsForTitle(
                            tvShow.imdbId,
                            false,
                        )
                    this.logger.log(
                        `Successfully fetched and saved ${locations.length} locations for TV show ${tvShow.imdbId}`,
                    )
                } else {
                    this.logger.warn(
                        `Failed to fetch locations for TV show ${tvShow.imdbId}`,
                    )
                }
            } else {
                this.logger.debug(
                    `Found ${locations.length} existing locations for TV show ${tvShow.imdbId}`,
                )
            }

            return locations
        } catch (error) {
            this.logger.error('Error fetching filming locations:', error)
            return []
        }
    }
}
