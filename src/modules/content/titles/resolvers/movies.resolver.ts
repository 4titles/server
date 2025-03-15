import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { TitleCategory } from '../enums/title-category.enum'
import { Movie } from '../models/movie.model'
import { MovieService } from '../services/movie.service'
@Resolver(() => Movie)
export class MoviesResolver {
    constructor(private readonly movieService: MovieService) {}

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description:
            'Get a list of movies with optional category filter and limit',
    })
    async movies(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category?: TitleCategory,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(limit, category)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Get a list of popular movies with an optional limit',
    })
    async popularMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(
            limit,
            TitleCategory.POPULAR,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Get a list of top-rated movies with an optional limit',
    })
    async topRatedMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(
            limit,
            TitleCategory.TOP_RATED,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Get a list of trending movies with an optional limit',
    })
    async trendingMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(
            limit,
            TitleCategory.TRENDING,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Get a list of searched movies with an optional limit',
    })
    async searchedMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(
            limit,
            TitleCategory.SEARCH,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Get a list of upcoming movies with an optional limit',
    })
    async upcomingMovies(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.getMoviesByCategory(
            limit,
            TitleCategory.UPCOMING,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Movie, {
        nullable: true,
        description: 'Get a movie by TMDB ID',
    })
    async movie(
        @Args('tmdbId', { type: () => Int }) tmdbId: number,
    ): Promise<Movie> {
        return await this.movieService.getMovieByTmdbId(tmdbId)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Movie], {
        description: 'Search for movies by query with an optional limit',
    })
    async searchMovies(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.searchMoviesOnTMDB(query, limit)
    }
}
