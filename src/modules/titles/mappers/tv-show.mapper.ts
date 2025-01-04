import { ShowResponse } from 'moviedb-promise'
import { TvShow } from '../models/tv-show.model'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleMapper } from './title.mapper'

export class TvShowMapper extends TitleMapper {
    async mapShowResponseToTvShow(
        showResponse: ShowResponse & { imdb_id: string },
        category: TitleCategory,
    ): Promise<TvShow> {
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
            genres: await this.mapGenres(
                showResponse.genres.map((g) => ({
                    tmdbId: String(g.id || 0),
                    names: { en: '', ru: g.name },
                })),
            ),
            homepage: showResponse.homepage,
            inProduction: showResponse.in_production,
            lastAirDate: showResponse.last_air_date,
            networks: this.mapNetworks(showResponse.networks),
            numberOfEpisodes: showResponse.number_of_episodes,
            numberOfSeasons: showResponse.number_of_seasons,
            originCountry: showResponse.origin_country,
            popularity: showResponse.popularity,
            productionCompanies: this.mapProductionCompanies(
                showResponse.production_companies,
            ),
            productionCountries: this.mapProductionCountries(
                showResponse.production_countries,
            ),
            status: showResponse.status,
            tagLine: showResponse.tagline,
            voteAverage: showResponse.vote_average,
            voteCount: showResponse.vote_count,
            updatedAt: new Date(),
            category,
        }
    }
}
