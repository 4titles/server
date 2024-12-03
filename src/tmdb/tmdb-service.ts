import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
    MovieDb,
    MovieResponse,
    MovieResultsResponse,
    ShowResponse,
    TvResultsResponse,
} from 'moviedb-promise'
import { TmdbException } from './exceptions/tmdb.exception'

@Injectable()
export class TmdbService {
    private readonly moviedb: MovieDb
    private readonly logger = new Logger(TmdbService.name)
    private readonly defaultLanguage: string

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('tmdb.apiKey')
        if (!apiKey) {
            throw new Error('TMDB_API_KEY is not defined')
        }

        this.moviedb = new MovieDb(apiKey)
        this.defaultLanguage =
            this.configService.get<string>('tmdb.defaultLanguage') ?? 'ru-RU'
    }

    async getMovieDetails(movieTMDBId: number): Promise<MovieResponse> {
        try {
            return await this.moviedb.movieInfo({
                id: movieTMDBId,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie details for ${movieTMDBId}`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie details for ${movieTMDBId}`,
            )
        }
    }

    async getTvDetails(tvTMDBId: number): Promise<ShowResponse> {
        try {
            return await this.moviedb.tvInfo({
                id: tvTMDBId,
                language: this.defaultLanguage,
            })
        } catch (error) {
            this.logger.error(
                `Failed to fetch tv details for ${tvTMDBId}`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch tv details for ${tvTMDBId}`,
            )
        }
    }

    async getPopularMovies(page: number = 1): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.moviePopular({
                page,
                language: this.defaultLanguage,
                // TODO: think about region param
            })
        } catch (error) {
            this.logger.error(`Failed to fetch popular movies`, error)
            throw new TmdbException(`Failed to fetch popular movies`)
        }
    }

    async getPopularTvShows(page: number = 1): Promise<TvResultsResponse> {
        try {
            return await this.moviedb.tvPopular({
                page,
                language: this.defaultLanguage,
                // TODO: think about region param
            })
        } catch (error) {
            this.logger.error(`Failed to fetch popular tv shows`, error)
            throw new TmdbException(`Failed to fetch popular tv shows`)
        }
    }

    async searchMovies(
        query: string,
        page: number = 1,
    ): Promise<MovieResultsResponse> {
        try {
            return await this.moviedb.searchMovie({
                query,
                page,
                language: this.defaultLanguage,
                include_adult: false,
            })
        } catch (error) {
            this.logger.error(`Failed to search movies`, error)
            throw new TmdbException(`Failed to search movies`)
        }
    }

    async searchTvShows(query: string, page: number = 1) {
        try {
            return await this.moviedb.searchTv({
                query,
                page,
                language: this.defaultLanguage,
                include_adult: false,
            })
        } catch (error) {
            this.logger.error(
                `Failed to search TV shows with query "${query}":`,
                error,
            )
            throw new TmdbException(
                `Failed to search TV shows: ${error.message}`,
            )
        }
    }

    async getMovieCredits(movieId: number) {
        try {
            return await this.moviedb.movieCredits({ id: movieId })
        } catch (error) {
            this.logger.error(
                `Failed to fetch movie credits for ID ${movieId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch movie credits: ${error.message}`,
            )
        }
    }

    async getTvCredits(tvId: number) {
        try {
            return await this.moviedb.tvCredits({ id: tvId })
        } catch (error) {
            this.logger.error(
                `Failed to fetch TV credits for ID ${tvId}:`,
                error,
            )
            throw new TmdbException(
                `Failed to fetch TV credits: ${error.message}`,
            )
        }
    }
}
