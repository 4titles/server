import { Inject, Injectable, Logger } from '@nestjs/common'
import { MovieResponse, ShowResponse } from 'moviedb-promise'
import { DRIZZLE } from 'src/drizzle/drizzle.module'
import { DatabaseException } from '../exceptions/database.exception'
import { eq } from 'drizzle-orm'
import { DrizzleDB } from 'src/drizzle/types/drizzle'
import { movies, series } from 'src/drizzle/schema/schema'

@Injectable()
export class TitleEntityService {
    private readonly logger = new Logger(TitleEntityService.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async createOrUpdateMovie(movie: MovieResponse) {
        try {
            const movieData = {
                tmdbId: movie.id,
                imdbId: movie.imdb_id || '',
                title: movie.title,
                originalTitle: movie.original_title,
                overview: movie.overview || '',
                posterPath: movie.poster_path,
                backdropPath: movie.backdrop_path,
                adult: movie.adult,
                budget: movie.budget,
                genres: movie.genres,
                homepage: movie.homepage,
                originalLanguage: movie.original_language,
                popularity: movie.popularity,
                releaseDate: movie.release_date
                    ? new Date(movie.release_date)
                    : null,
                revenue: movie.revenue,
                runtime: movie.runtime,
                status: movie.status,
                tagLine: movie.tagline,
                voteAverage: movie.vote_average,
                voteCount: movie.vote_count,
                productionCompanies: movie.production_companies,
                productionCountries: movie.production_countries,
                spokenLanguages: movie.spoken_languages,
                originCountry:
                    movie.production_countries?.map((c) => c.iso_3166_1) || [],
                // updatedAt: new Date(),
            }

            await this.db.insert(movies).values(movieData).onConflictDoUpdate({
                target: movies.tmdbId,
                set: movieData,
            })

            this.logger.log(
                `Successfully created/updated movie with TMDB ID ${movie.id}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to create/update movie with TMDB ID ${movie.id}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to create/update movie: ${error.message}`,
            )
        }
    }

    async createOrUpdateTvShow(tv: ShowResponse & { imdb_id: string }) {
        try {
            const tvShowData = {
                tmdbId: tv.id,
                imdbId: tv.imdb_id || '',
                name: tv.name,
                originalName: tv.original_name,
                overview: tv.overview || '',
                posterPath: tv.poster_path,
                backdropPath: tv.backdrop_path,
                createdBy: tv.created_by,
                episodeRunTime: tv.episode_run_time || [],
                firstAirDate: tv.first_air_date
                    ? new Date(tv.first_air_date)
                    : null,
                genres: tv.genres,
                homepage: tv.homepage,
                inProduction: tv.in_production,
                languages: tv.languages || [],
                lastAirDate: tv.last_air_date
                    ? new Date(tv.last_air_date)
                    : null,
                networks: tv.networks,
                numberOfEpisodes: tv.number_of_episodes,
                numberOfSeasons: tv.number_of_seasons,
                originCountry: tv.origin_country || [],
                originalLanguage: tv.original_language,
                popularity: tv.popularity,
                productionCompanies: tv.production_companies,
                productionCountries: tv.production_countries,
                spokenLanguages: tv.spoken_languages,
                status: tv.status,
                tagLine: tv.tagline,
                voteAverage: tv.vote_average,
                voteCount: tv.vote_count,
                updatedAt: new Date(),
            }

            await this.db.insert(series).values(tvShowData).onConflictDoUpdate({
                target: series.tmdbId,
                set: tvShowData,
            })

            this.logger.log(
                `Successfully created/updated TV show with TMDB ID ${tv.id}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to create/update TV show with TMDB ID ${tv.id}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to create/update TV show: ${error.message}`,
            )
        }
    }

    async getMovieByTmdbId(tmdbId: number) {
        try {
            return await this.db.query.movies.findFirst({
                where: eq(movies.tmdbId, tmdbId),
            })
        } catch (error) {
            this.logger.error(
                `Failed to get movie with TMDB ID ${tmdbId}:`,
                error,
            )
            throw new DatabaseException(`Failed to get movie: ${error.message}`)
        }
    }

    async getTvShowByTmdbId(tmdbId: number) {
        try {
            return await this.db.query.series.findFirst({
                where: eq(series.tmdbId, tmdbId),
            })
        } catch (error) {
            this.logger.error(
                `Failed to get TV show with TMDB ID ${tmdbId}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to get TV show: ${error.message}`,
            )
        }
    }

    async getPopularMovies(limit: number = 20) {
        try {
            return await this.db.query.movies.findMany({
                orderBy: (movies, { desc }) => [desc(movies.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get popular movies:', error)
            throw new DatabaseException(
                `Failed to get popular movies: ${error.message}`,
            )
        }
    }

    async getPopularTvShows(limit: number = 20) {
        try {
            return await this.db.query.series.findMany({
                orderBy: (series, { desc }) => [desc(series.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get popular TV shows:', error)
            throw new DatabaseException(
                `Failed to get popular TV shows: ${error.message}`,
            )
        }
    }

    async searchMovies(query: string, limit: number = 20) {
        try {
            return await this.db.query.movies.findMany({
                where: (movies, { ilike, or }) =>
                    or(
                        ilike(movies.title, `%${query}%`),
                        ilike(movies.originalTitle, `%${query}%`),
                    ),
                orderBy: (movies, { desc }) => [desc(movies.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error(
                `Failed to search movies with query "${query}":`,
                error,
            )
            throw new DatabaseException(
                `Failed to search movies: ${error.message}`,
            )
        }
    }

    async searchTvShows(query: string, limit: number = 20) {
        try {
            return await this.db.query.series.findMany({
                where: (series, { ilike, or }) =>
                    or(
                        ilike(series.name, `%${query}%`),
                        ilike(series.originalName, `%${query}%`),
                    ),
                orderBy: (series, { desc }) => [desc(series.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error(
                `Failed to search TV shows with query "${query}":`,
                error,
            )
            throw new DatabaseException(
                `Failed to search TV shows: ${error.message}`,
            )
        }
    }

    async deleteMovie(tmdbId: number) {
        try {
            await this.db.delete(movies).where(eq(movies.tmdbId, tmdbId))
            this.logger.log(`Successfully deleted movie with TMDB ID ${tmdbId}`)
        } catch (error) {
            this.logger.error(
                `Failed to delete movie with TMDB ID ${tmdbId}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to delete movie: ${error.message}`,
            )
        }
    }

    async deleteTvShow(tmdbId: number) {
        try {
            await this.db.delete(series).where(eq(series.tmdbId, tmdbId))
            this.logger.log(
                `Successfully deleted TV show with TMDB ID ${tmdbId}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to delete TV show with TMDB ID ${tmdbId}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to delete TV show: ${error.message}`,
            )
        }
    }
}
