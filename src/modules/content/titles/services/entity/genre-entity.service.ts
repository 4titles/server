import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbGenre,
    DbMovieGenre,
    DbSeriesGenre,
    genres as genresTable,
    movieGenres,
    seriesGenres,
} from '@/modules/infrastructure/drizzle/schema/genres.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import { TitleType } from '../../enums/title-type.enum'
import { DatabaseException } from '../../exceptions/database.exception'
import { Genre } from '../../models/genre.model'
import { TitleEntityService } from './title-entity.service'

@Injectable()
export class GenreEntityService {
    private readonly logger = new Logger(GenreEntityService.name)
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async createOrUpdate(genre?: Genre) {
        try {
            if (!genre) return

            return await this.db
                .insert(genresTable)
                .values({
                    tmdbId: BigInt(genre.tmdbId),
                    names: genre.names,
                })
                .onConflictDoUpdate({
                    target: genresTable.tmdbId,
                    set: {
                        tmdbId: BigInt(genre.tmdbId),
                        names: genre.names,
                    },
                })
        } catch (error) {
            throw new DatabaseException(
                `Failed to create/update genre: ${error.message}`,
            )
        }
    }

    async getAll(): Promise<DbGenre[]> {
        try {
            return await this.db.query.genres.findMany({
                orderBy: sql`names->>'en' asc`,
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to fetch all genres: ${error.message}`,
            )
        }
    }

    async getByTmdbId(tmdbId: bigint): Promise<DbGenre> {
        try {
            return await this.db.query.genres.findFirst({
                where: eq(genresTable.tmdbId, tmdbId),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to find genre by TMDBId: ${error.message}`,
            )
        }
    }

    async getMovieGenres(movieId: bigint): Promise<DbMovieGenre[]> {
        try {
            return await this.db.query.movieGenres.findMany({
                where: eq(movieGenres.movieId, movieId),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to find movie genres: ${error.message}`,
            )
        }
    }

    async getTvShowGenres(tvShowId: bigint): Promise<DbSeriesGenre[]> {
        try {
            return await this.db.query.seriesGenres.findMany({
                where: eq(seriesGenres.seriesId, tvShowId),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to find movie genres: ${error.message}`,
            )
        }
    }

    async getForTitle(imdbId: string, isMovie?: boolean): Promise<DbGenre[]> {
        try {
            const { title, type } = await this.titleEntityService.findByImdbId(
                imdbId,
                isMovie,
            )

            const genreRelationsEntities =
                type === TitleType.MOVIES
                    ? await this.getMovieGenres(title.id)
                    : await this.getTvShowGenres(title.id)

            const dbGenres: DbGenre[] = []
            for (const genreRelation of genreRelationsEntities) {
                const genre = await this.db.query.genres.findFirst({
                    where: eq(genresTable.id, genreRelation.genreId),
                })
                if (genre) {
                    dbGenres.push(genre)
                }
            }

            return dbGenres
        } catch (error) {
            this.logger.error(
                `Error fetching genres for title with imdbId ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async saveGenres(
        genres: Genre[],
        titleImdbId: string,
        isMovie?: boolean,
    ): Promise<void> {
        try {
            const { title, type } = await this.titleEntityService.findByImdbId(
                titleImdbId,
                isMovie,
            )

            for (const genre of genres) {
                const genreEntity = await this.getByTmdbId(BigInt(genre.tmdbId))

                if (!genreEntity) {
                    await this.createOrUpdate(genre)
                }

                if (type === TitleType.MOVIES) {
                    await this.db
                        .insert(movieGenres)
                        .values({
                            movieId: title.id,
                            genreId: genreEntity.id,
                        })
                        .onConflictDoNothing()
                } else {
                    await this.db
                        .insert(seriesGenres)
                        .values({
                            seriesId: title.id,
                            genreId: genreEntity.id,
                        })
                        .onConflictDoNothing()
                }
            }
        } catch (error) {
            this.logger.error(
                `Error saving genres for title with imdbId ${titleImdbId}:`,
                error,
            )
            throw error
        }
    }
}
