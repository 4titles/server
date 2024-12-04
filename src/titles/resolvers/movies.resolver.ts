import { Resolver, Query, Args, Int } from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { Movie } from '../models/movie.model'
import { MovieService } from '../services/movie.service'
import { TitleCategory } from '../enums/title-category.enum'

@Resolver(() => Movie)
export class MoviesResolver {
    private readonly logger = new Logger(MoviesResolver.name)

    constructor(private readonly movieService: MovieService) {}

    @Query(() => [Movie])
    async movies(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.movieService.getMovies(limit, category)
    }

    @Query(() => [Movie])
    async popularMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.movieService.getPopularMovies(limit)
    }

    @Query(() => [Movie])
    async topRatedMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.movieService.getTopRatedMovies(limit)
    }

    @Query(() => [Movie])
    async trendingMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.movieService.getTrendingMovies(limit)
    }

    @Query(() => Movie, { nullable: true })
    async movie(@Args('tmdbId', { type: () => Int }) tmdbId: number) {
        return this.movieService.getMovieDetails(tmdbId)
    }

    @Query(() => [Movie])
    async searchMovies(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return this.movieService.searchMovies(query, limit)
    }
}
