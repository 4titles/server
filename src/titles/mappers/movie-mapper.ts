import { MovieResponse, Genre as TmdbGenre } from 'moviedb-promise'
import { Movie } from '../models/movie.model'
import {
    Genre,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
} from '../models/common.model'
import { TitleCategory } from '../enums/title-category.enum'
import { MovieStatus } from '../enums/movie-status.enum'

export class MovieMapper {
    static mapMovieResponseToMovie(
        movieResponse: MovieResponse,
        category: TitleCategory,
    ): Movie {
        return {
            tmdbId: movieResponse.id,
            imdbId: movieResponse.imdb_id || '',
            title: movieResponse.title,
            originalTitle: movieResponse.original_title,
            overview: movieResponse.overview || '',
            posterPath: movieResponse.poster_path,
            backdropPath: movieResponse.backdrop_path,
            adult: movieResponse.adult,
            budget: movieResponse.budget,
            genres: this.mapGenres(movieResponse.genres),
            homepage: movieResponse.homepage,
            originalLanguage: movieResponse.original_language,
            popularity: movieResponse.popularity,
            releaseDate: movieResponse.release_date,
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
            spokenLanguages: this.mapSpokenLanguages(
                movieResponse.spoken_languages,
            ),
            originCountry:
                movieResponse.production_countries?.map(
                    (country) => country.iso_3166_1,
                ) || [],
            updatedAt: new Date().toISOString(),
            category,
        }
    }

    private static mapGenres(genres?: TmdbGenre[]): Genre[] {
        if (!genres) return []
        return genres.map((genre) => ({
            id: genre.id || 0,
            name: genre.name || '',
        }))
    }

    private static mapProductionCompanies(
        companies?: any[],
    ): ProductionCompany[] {
        if (!companies) return []
        return companies.map((company) => ({
            id: company.id || 0,
            name: company.name || '',
            logo_path: company.logo_path,
            origin_country: company.origin_country || '',
        }))
    }

    private static mapProductionCountries(
        countries?: any[],
    ): ProductionCountry[] {
        if (!countries) return []
        return countries.map((country) => ({
            iso_3166_1: country.iso_3166_1 || '',
            name: country.name || '',
        }))
    }

    private static mapSpokenLanguages(languages?: any[]): SpokenLanguage[] {
        if (!languages) return []
        return languages.map((language) => ({
            english_name: language.english_name || '',
            iso_639_1: language.iso_639_1 || '',
            name: language.name || '',
        }))
    }
}
