import {
    Resolver,
    Query,
    Args,
    Int,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { Movie } from '../models/movie.model'
import { MovieService } from '../services/movie.service'
import { TitleCategory } from '../enums/title-category.enum'
import { LocationsService } from 'src/locations/services/locations.service'

@Resolver(() => Movie)
export class MoviesResolver {
    private readonly logger = new Logger(MoviesResolver.name)

    constructor(
        private readonly movieService: MovieService,
        private readonly locationsService: LocationsService,
    ) {}

    @Query(() => [Movie])
    async movies(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getMovies(limit, category)
    }

    @Query(() => [Movie])
    async popularMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getPopularMovies(limit)
    }

    @Query(() => [Movie])
    async topRatedMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getTopRatedMovies(limit)
    }

    @Query(() => [Movie])
    async trendingMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getTrendingMovies(limit)
    }

    @Query(() => Movie, { nullable: true })
    async movie(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return await this.movieService.getMovieDetails(tmdbId)
    }

    @Query(() => [Movie])
    async searchMovies(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.searchMovies(query, limit)
    }

    @ResolveField('filmingLocations')
    async getFilmingLocations(@Parent() movie: Movie) {
        try {
            if (!movie.imdbId) {
                return []
            }

            let locations = await this.locationsService.getLocationsForTitle(
                movie.imdbId,
                true,
            )

            if (locations.length === 0) {
                this.logger.log(
                    `No locations found for movie ${movie.imdbId}, fetching from IMDB...`,
                )

                const success =
                    await this.locationsService.syncLocationsForTitle(
                        movie.imdbId,
                    )

                if (success) {
                    locations =
                        await this.locationsService.getLocationsForTitle(
                            movie.imdbId,
                            false,
                        )
                    this.logger.log(
                        `Successfully fetched and saved ${locations.length} locations for movie ${movie.imdbId}`,
                    )
                } else {
                    this.logger.warn(
                        `Failed to fetch locations for movie ${movie.imdbId}`,
                    )
                }
            } else {
                this.logger.debug(
                    `Found ${locations.length} existing locations for movie ${movie.imdbId}`,
                )
            }

            return locations
        } catch (error) {
            this.logger.error('Error fetching filming locations:', error)
            return []
        }
    }
}
