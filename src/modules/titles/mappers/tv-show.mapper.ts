import { Injectable } from '@nestjs/common'
import { BaseMapper } from './base.mapper'
import {
    TitleMappingContext,
    TvShowMappingContext,
} from '../types/mapping.type'
import { TvShow } from '../models/tv-show.model'
import { DbSeries } from '@/modules/drizzle/schema/series.schema'
@Injectable()
export class TvShowMapper extends BaseMapper {
    async mapToEntity(context: TvShowMappingContext): Promise<TvShow> {
        const { showResponse: response, category } = context

        const tvShow: TvShow = {
            tmdbId: response.id,
            imdbId: response.imdb_id,
            name: response.name,
            originalName: response.original_name,
            overview: response.overview,
            posterPath: response.poster_path,
            backdropPath: response.backdrop_path,
            createdBy: this.mapTmdbCreatedBy(response.created_by),
            episodeRunTime: response.episode_run_time,
            firstAirDate: response.first_air_date,
            homepage: response.homepage,
            inProduction: response.in_production,
            lastAirDate: response.last_air_date,
            networks: this.mapTmdbNetworks(response.networks),
            numberOfEpisodes: response.number_of_episodes,
            numberOfSeasons: response.number_of_seasons,
            originCountry: response.origin_country,
            popularity: response.popularity,
            productionCompanies: this.mapTmdbProductionCompanies(
                response.production_companies,
            ),
            productionCountries: this.mapTmdbProductionCountries(
                response.production_countries,
            ),
            status: response.status,
            tagLine: response.tagline,
            voteAverage: response.vote_average,
            voteCount: response.vote_count,
            updatedAt: new Date(),
            genres: this.mapTmdbGenres(response.genres),
            category,
        }

        return this.mapRelations(tvShow, context)
    }

    async mapFromDatabase(
        dbSeries: DbSeries,
        context: TitleMappingContext,
    ): Promise<TvShow> {
        const tvShow: TvShow = {
            ...dbSeries,
            tmdbId: Number(dbSeries.tmdbId),
            numberOfEpisodes: Number(dbSeries.numberOfEpisodes),
            numberOfSeasons: Number(dbSeries.numberOfSeasons),
            voteCount: Number(dbSeries.voteCount),
        }

        return this.mapRelations(tvShow, context)
    }

    async mapMany<T extends DbSeries>(
        entities: T[],
        context: TitleMappingContext,
    ): Promise<TvShow[]> {
        return Promise.all(
            entities.map((entity) =>
                this.mapFromDatabase(entity, {
                    ...context,
                    category: entity.category,
                }),
            ),
        )
    }

    async mapManyWithRelations<T extends DbSeries>(
        entities: T[],
    ): Promise<TvShow[]> {
        return Promise.all(
            entities.map((dbTvShow) =>
                this.mapFromDatabase(dbTvShow, {
                    category: dbTvShow.category,
                    includeRelations: true,
                }),
            ),
        )
    }
}
