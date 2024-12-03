import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql'
import { TitlesService } from './services/titles.service'
import { Logger } from '@nestjs/common'
import { SyncResult } from './models/sync-result.model'
import { Movie } from './models/movie.model'
import { TvShow } from './models/tv-show.model'
import { TitleType } from './enums/title-type.enum'

@Resolver()
export class TitlesResolver {
    private readonly logger = new Logger(TitlesResolver.name)

    constructor(private readonly titlesService: TitlesService) {}

    @Mutation(() => SyncResult)
    async syncPopularTitles(
        @Args('type', { type: () => TitleType, nullable: true })
        type: TitleType = TitleType.ALL,
    ) {
        this.logger.log(`Starting titles cache refresh for type: ${type}`)

        let movies: any[] = []
        let tvShows: any[] = []

        switch (type) {
            case TitleType.MOVIES:
                movies = await this.titlesService.syncPopularMovies()
                break
            case TitleType.TV_SHOWS:
                tvShows = await this.titlesService.syncPopularTvShows()
                break
            case TitleType.ALL:
            default:
                ;[movies, tvShows] = await Promise.all([
                    this.titlesService.syncPopularMovies(),
                    this.titlesService.syncPopularTvShows(),
                ])
        }

        this.logger.log(
            `Cache refresh completed: ${movies.length} movies and ${tvShows.length} TV shows`,
        )

        return {
            moviesCount: movies.length,
            tvShowsCount: tvShows.length,
        }
    }

    @Query(() => [Movie])
    async movies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.titlesService.getPopularMovies(limit)
    }

    @Query(() => [TvShow])
    async tvShows(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.titlesService.getPopularTvShows(limit)
    }

    @Query(() => Movie, { nullable: true })
    async movie(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return this.titlesService.getMovieDetails(tmdbId)
    }

    @Query(() => TvShow, { nullable: true })
    async tvShow(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return this.titlesService.getTvShowDetails(tmdbId)
    }

    @Query(() => [Movie])
    async searchMovies(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.titlesService.searchMovies(query, limit)
    }

    @Query(() => [TvShow])
    async searchTvShows(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.titlesService.searchTvShows(query, limit)
    }
}
