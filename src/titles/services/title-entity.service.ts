import { Inject, Injectable, Logger } from '@nestjs/common'
import { DRIZZLE } from 'src/drizzle/drizzle.module'
import { DatabaseException } from '../exceptions/database.exception'
import { eq } from 'drizzle-orm'
import { DrizzleDB } from 'src/drizzle/types/drizzle'
import { movies, series } from 'src/drizzle/schema/schema'
import { TitleCategory } from '../enums/title-category.enum'
import { Movie } from '../models/movie.model'
import { TvShow } from '../models/tv-show.model'

@Injectable()
export class TitleEntityService {
    private readonly logger = new Logger(TitleEntityService.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async createOrUpdateMovie(movie: Movie): Promise<void> {
        try {
            await this.db.insert(movies).values(movie).onConflictDoUpdate({
                target: movies.tmdbId,
                set: movie,
            })

            this.logger.log(
                `Successfully created/updated movie with TMDB ID ${movie.tmdbId}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to create/update movie with TMDB ID ${movie.tmdbId}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to create/update movie: ${error.message}`,
            )
        }
    }

    async createOrUpdateTvShow(tv: TvShow): Promise<void> {
        try {
            await this.db.insert(series).values(tv).onConflictDoUpdate({
                target: series.tmdbId,
                set: tv,
            })

            this.logger.log(
                `Successfully created/updated TV show with TMDB ID ${tv.tmdbId}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to create/update TV show with TMDB ID ${tv.tmdbId}:`,
                error,
            )
            throw new DatabaseException(
                `Failed to create/update TV show: ${error.message}`,
            )
        }
    }

    async getMovieByTmdbId(tmdbId: number): Promise<Movie> {
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

    async getTvShowByTmdbId(tmdbId: number): Promise<TvShow> {
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

    async getPopularMovies(limit: number = 20): Promise<Movie[]> {
        try {
            return await this.db.query.movies.findMany({
                where: eq(movies.category, TitleCategory.POPULAR),
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

    async getPopularTvShows(limit: number = 20): Promise<TvShow[]> {
        try {
            return await this.db.query.series.findMany({
                where: eq(series.category, TitleCategory.POPULAR),
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

    async getTopRatedMovies(limit: number = 20): Promise<Movie[]> {
        try {
            return await this.db.query.movies.findMany({
                where: eq(movies.category, TitleCategory.TOP_RATED),
                orderBy: (movies, { desc }) => [desc(movies.voteAverage)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get top rated movies:', error)
            throw new DatabaseException(
                `Failed to get top rated movies: ${error.message}`,
            )
        }
    }

    async getTopRatedTvShows(limit: number = 20): Promise<TvShow[]> {
        try {
            return await this.db.query.series.findMany({
                where: eq(series.category, TitleCategory.TOP_RATED),
                orderBy: (series, { desc }) => [desc(series.voteAverage)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get top rated TV shows:', error)
            throw new DatabaseException(
                `Failed to get top rated TV shows: ${error.message}`,
            )
        }
    }

    async getTrendingMovies(limit: number = 20): Promise<Movie[]> {
        try {
            return await this.db.query.movies.findMany({
                where: eq(movies.category, TitleCategory.TRENDING),
                orderBy: (movies, { desc }) => [desc(movies.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get trending movies:', error)
            throw new DatabaseException(
                `Failed to get trending movies: ${error.message}`,
            )
        }
    }

    async getTrendingTvShows(limit: number = 20): Promise<TvShow[]> {
        try {
            return await this.db.query.series.findMany({
                where: eq(series.category, TitleCategory.TRENDING),
                orderBy: (series, { desc }) => [desc(series.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get trending TV shows:', error)
            throw new DatabaseException(
                `Failed to get trending TV shows: ${error.message}`,
            )
        }
    }

    async getAllMovies(limit: number = 20): Promise<Movie[]> {
        try {
            return await this.db.query.movies.findMany({
                orderBy: (movies, { desc }) => [desc(movies.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get all movies:', error)
            throw new DatabaseException(
                `Failed to get all movies: ${error.message}`,
            )
        }
    }

    async getAllTvShows(limit: number = 20): Promise<TvShow[]> {
        try {
            return await this.db.query.series.findMany({
                orderBy: (series, { desc }) => [desc(series.popularity)],
                limit,
            })
        } catch (error) {
            this.logger.error('Failed to get all TV shows:', error)
            throw new DatabaseException(
                `Failed to get all TV shows: ${error.message}`,
            )
        }
    }

    async searchMovies(query: string, limit: number = 20): Promise<Movie[]> {
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

    async searchTvShows(query: string, limit: number = 20): Promise<TvShow[]> {
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

    async deleteMovie(tmdbId: number): Promise<void> {
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

    async deleteTvShow(tmdbId: number): Promise<void> {
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
