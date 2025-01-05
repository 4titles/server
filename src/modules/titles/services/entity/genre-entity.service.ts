import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Genre } from '../../models/genre.model'
import { TitleEntityService } from './title-entity.service'
import { eq, sql } from 'drizzle-orm'
import {
    DbGenre,
    genres,
    movieGenres,
    seriesGenres,
} from '@/modules/drizzle/schema/genres.schema'
import { DatabaseException } from '../../exceptions/database.exception'
import { DbTitle } from '../../types/title.type'

@Injectable()
export class GenreEntityService {
    private readonly logger = new Logger(GenreEntityService.name)
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleEntityService: TitleEntityService,
    ) {}

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
                where: eq(genres.tmdbId, tmdbId),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to find genre by TMDBId: ${error.message}`,
            )
        }
    }

    async getForTitle(imdbId: string, isMovie: boolean): Promise<DbGenre[]> {
        try {
            const entity: DbTitle = isMovie
                ? await this.titleEntityService.findMovieByImdbId(imdbId)
                : await this.titleEntityService.findTvShowByImdbId(imdbId)

            if (!entity) return []

            const genreRelationsEntities = isMovie
                ? await this.db.query.movieGenres.findMany({
                      where: eq(movieGenres.movieId, entity.id),
                  })
                : await this.db.query.seriesGenres.findMany({
                      where: eq(seriesGenres.seriesId, entity.id),
                  })

            const dbGenres: DbGenre[] = []

            for (const genreRelation of genreRelationsEntities) {
                const genre = await this.db.query.genres.findFirst({
                    where: eq(genres.id, genreRelation.genreId),
                })
                if (genre) {
                    dbGenres.push(genre)
                }
            }

            return dbGenres
        } catch (error) {
            this.logger.error(
                `Error fetching genres for imdbId ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async saveGenres(
        genres: Genre[],
        movieId?: bigint,
        seriesId?: bigint,
    ): Promise<void> {
        try {
            if (!movieId && !seriesId) {
                return
            }

            for (const genre of genres) {
                const genreEntity = await this.getByTmdbId(BigInt(genre.tmdbId))

                if (movieId) {
                    await this.db
                        .insert(movieGenres)
                        .values({
                            movieId,
                            genreId: genreEntity.id,
                        })
                        .onConflictDoNothing()
                } else {
                    await this.db
                        .insert(seriesGenres)
                        .values({
                            seriesId,
                            genreId: genreEntity.id,
                        })
                        .onConflictDoNothing()
                }
            }
        } catch (error) {
            this.logger.error(
                `Error saving genres for title with imdbId: ${movieId || seriesId} - `,
                error,
            )
            throw error
        }
    }
}
