import {
    Resolver,
    Query,
    Args,
    Int,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { Movie } from '../models/movie.model'
import { MovieService } from '../services/movie.service'
import { TitleCategory } from '../enums/title-category.enum'
import { LocationsService } from '@/modules/locations/services/locations.service'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'
import { MovieLanguage } from '../models/language.model'
import { LanguageService } from '../services'

@Resolver(() => Movie)
export class MoviesResolver {
    constructor(
        private readonly movieService: MovieService,
        private readonly locationsService: LocationsService,
        private readonly languageService: LanguageService,
    ) {}

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

    @Query(() => Movie, {
        nullable: true,
        description: 'Get a movie by TMDB ID',
    })
    async movie(
        @Args('tmdbId', { type: () => Int }) tmdbId: number,
    ): Promise<Movie> {
        return await this.movieService.getMovieByTmdbId(tmdbId)
    }

    @Query(() => [Movie], {
        description: 'Search for movies by query with an optional limit',
    })
    async searchMovies(
        @Args('query') query: string,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ): Promise<Movie[]> {
        return await this.movieService.searchMoviesOnTMDB(query, limit)
    }

    @ResolveField('filmingLocations', () => [FilmingLocation], {
        description: 'Get filming locations for the movie',
    })
    async getFilmingLocations(@Parent() movie: Movie) {
        if (!movie.filmingLocations && movie.imdbId) {
            return this.locationsService.getLocationsForTitle(
                movie.imdbId,
                true,
            )
        }
        return movie.filmingLocations || []
    }

    @ResolveField('languages', () => [MovieLanguage], {
        description: 'Get languages for the movie',
    })
    async getLanguages(@Parent() movie: Movie) {
        return await this.languageService.getLanguagesForTitle(movie.imdbId)
    }
}
