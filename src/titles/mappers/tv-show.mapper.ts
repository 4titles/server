import {
    ShowResponse,
    SimplePerson,
    Genre as TmdbGenre,
    Network as TmdbNetwork,
} from 'moviedb-promise'
import { TvShow } from '../models/tv-show.model'
import {
    Genre,
    CreatedBy,
    Network,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
} from '../models/common.model'
import { TitleCategory } from '../enums/title-category.enum'

export class TvShowMapper {
    static mapShowResponseToTvShow(
        showResponse: ShowResponse & { imdb_id: string },
        category: TitleCategory,
    ): TvShow {
        return {
            tmdbId: showResponse.id,
            imdbId: showResponse.imdb_id,
            name: showResponse.name,
            originalName: showResponse.original_name,
            overview: showResponse.overview,
            posterPath: showResponse.poster_path,
            backdropPath: showResponse.backdrop_path,
            createdBy: this.mapCreatedBy(showResponse.created_by),
            episodeRunTime: showResponse.episode_run_time,
            firstAirDate: showResponse.first_air_date,
            genres: this.mapGenres(showResponse.genres),
            homepage: showResponse.homepage,
            inProduction: showResponse.in_production,
            languages: showResponse.languages,
            lastAirDate: showResponse.last_air_date,
            networks: this.mapNetworks(showResponse.networks),
            numberOfEpisodes: showResponse.number_of_episodes,
            numberOfSeasons: showResponse.number_of_seasons,
            originCountry: showResponse.origin_country,
            originalLanguage: showResponse.original_language,
            popularity: showResponse.popularity,
            productionCompanies: this.mapProductionCompanies(
                showResponse.production_companies,
            ),
            productionCountries: this.mapProductionCountries(
                showResponse.production_countries,
            ),
            spokenLanguages: this.mapSpokenLanguages(
                showResponse.spoken_languages,
            ),
            status: showResponse.status,
            tagLine: showResponse.tagline,
            voteAverage: showResponse.vote_average,
            voteCount: showResponse.vote_count,
            updatedAt: new Date().toISOString(),
            category,
        }
    }

    private static mapCreatedBy(people?: SimplePerson[]): CreatedBy[] {
        if (!people) return []
        return people.map((person) => ({
            id: person.id || 0,
            credit_id: person.credit_id || '',
            name: person.name || '',
            gender: person.gender || 0,
            profile_path: person.profile_path,
        }))
    }

    private static mapGenres(genres?: TmdbGenre[]): Genre[] {
        if (!genres) return []
        return genres.map((genre) => ({
            id: genre.id || 0,
            name: genre.name || '',
        }))
    }

    private static mapNetworks(networks?: TmdbNetwork[]): Network[] {
        if (!networks) return []
        return networks.map((network) => ({
            id: network.id || 0,
            name: network.name || '',
            logo_path: network.logo_path,
            origin_country: network.origin_country || '',
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
