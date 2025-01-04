import { MovieResponse } from 'moviedb-promise'
import { Movie } from '../models/movie.model'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieStatus } from '../enums/movie-status.enum'
import { TitleMapper } from './title.mapper'

export class MovieMapper extends TitleMapper {
    async mapMovieResponseToMovie(
        movieResponse: MovieResponse,
        category: TitleCategory,
    ): Promise<Movie> {
        return {
            tmdbId: movieResponse.id,
            imdbId: movieResponse.imdb_id || '',
            title: movieResponse.title,
            originalTitle: movieResponse.original_title || '',
            overview: movieResponse.overview || '',
            posterPath: movieResponse.poster_path || null,
            backdropPath: movieResponse.backdrop_path,
            adult: movieResponse.adult,
            budget: movieResponse.budget,
            genres: await this.mapGenres(
                movieResponse.genres.map((g) => ({
                    tmdbId: String(g.id || 0),
                    names: { en: '', ru: g.name },
                })),
            ),
            homepage: movieResponse.homepage || null,
            popularity: movieResponse.popularity,
            releaseDate: movieResponse.release_date || null,
            revenue: movieResponse.revenue,
            runtime: movieResponse.runtime,
            status: movieResponse.status as MovieStatus,
            tagLine: movieResponse.tagline,
            voteAverage: movieResponse.vote_average,
            voteCount: movieResponse.vote_count,
            productionCompanies: this.mapProductionCompanies(
                movieResponse.production_companies,
            ),
            productionCountries: this.mapProductionCountries(
                movieResponse.production_countries,
            ),
            originCountry:
                movieResponse.production_countries?.map(
                    (country) => country.iso_3166_1,
                ) || [],
            updatedAt: new Date(),
            category,
        }
    }
}
