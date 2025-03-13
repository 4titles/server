import { DbMovie } from '@/modules/infrastructure/drizzle/schema/movies.schema'
import { Injectable } from '@nestjs/common'
import { MovieStatus } from '../enums/movie-status.enum'
import { Movie } from '../models/movie.model'
import { MovieMappingContext, TitleMappingContext } from '../types/mapping.type'
import { BaseMapper } from './base.mapper'

@Injectable()
export class MovieMapper extends BaseMapper {
    async mapToEntity(context: MovieMappingContext): Promise<Movie> {
        const { movieResponse: response, category } = context

        const movie: Movie = {
            tmdbId: response.id,
            imdbId: response.imdb_id || '',
            title: response.title,
            originalTitle: response.original_title || '',
            overview: response.overview || '',
            posterPath: response.poster_path || null,
            backdropPath: response.backdrop_path,
            adult: response.adult,
            budget: response.budget,
            homepage: response.homepage || null,
            popularity: response.popularity,
            releaseDate: response.release_date || null,
            revenue: response.revenue,
            runtime: response.runtime,
            status: response.status as MovieStatus,
            tagLine: response.tagline,
            voteAverage: response.vote_average,
            voteCount: response.vote_count,
            productionCompanies: this.mapTmdbProductionCompanies(
                response.production_companies,
            ),
            productionCountries: this.mapTmdbProductionCountries(
                response.production_countries,
            ),
            originCountry:
                response.production_countries?.map(
                    (country) => country.iso_3166_1,
                ) || [],
            updatedAt: new Date(),
            genres: this.mapTmdbGenres(response.genres),
            category,
        }

        return this.mapRelations(movie, context)
    }

    async mapFromDatabase(
        dbMovie: DbMovie,
        context: TitleMappingContext,
    ): Promise<Movie> {
        const movie: Movie = {
            ...dbMovie,
            tmdbId: Number(dbMovie.tmdbId),
            budget: Number(dbMovie.budget),
            revenue: Number(dbMovie.revenue),
            runtime: Number(dbMovie.runtime),
            voteCount: Number(dbMovie.voteCount),
        }

        return this.mapRelations(movie, context)
    }

    async mapMany<T extends DbMovie>(
        entities: T[],
        context: TitleMappingContext,
    ): Promise<Movie[]> {
        return Promise.all(
            entities.map((entity) =>
                this.mapFromDatabase(entity, {
                    ...context,
                    category: entity.category,
                }),
            ),
        )
    }

    async mapManyWithRelations<T extends DbMovie>(
        entities: T[],
    ): Promise<Movie[]> {
        return Promise.all(
            entities.map((dbMovie) =>
                this.mapFromDatabase(dbMovie, {
                    category: dbMovie.category,
                    includeRelations: true,
                }),
            ),
        )
    }
}
