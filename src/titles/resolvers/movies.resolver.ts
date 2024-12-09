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
import { FilmingLocation } from 'src/locations/models/filming-location.model'

@Resolver(() => Movie)
export class MoviesResolver {
    private readonly logger = new Logger(MoviesResolver.name)

    constructor(
        private readonly movieService: MovieService,
        private readonly locationsService: LocationsService,
    ) {}

    @Query(() => [Movie], {
        description:
            'Get a list of movies with optional category filter and limit',
    })
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

    @Query(() => [Movie])
    async searchedMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getSearchedMovies(limit)
    }

    @Query(() => [Movie])
    async upcomingMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return await this.movieService.getUpComingMovies(limit)
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

    @ResolveField('filmingLocations', () => [FilmingLocation])
    async getFilmingLocations(@Parent() movie: Movie) {
        if (!movie.filmingLocations && movie.imdbId) {
            return this.locationsService.getLocationsForTitle(
                movie.imdbId,
                true,
            )
        }
        return movie.filmingLocations || []
    }
}
