import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Genre } from '../../models/genre.model'
import { TitleEntityService } from './title-entity.service'
import { eq } from 'drizzle-orm'
import {
    DbGenre,
    genres,
    movieGenres,
    seriesGenres,
} from '@/modules/drizzle/schema/genres.schema'
import { DatabaseException } from '../../exceptions/database.exception'
import { DbTitle } from '../../types/title.type'
import { bigIntSerializer } from '../utils/json.utils'
import { GenreMapper } from '../../mappers/genre.mapper'

@Injectable()
export class GenreEntityService {
    private readonly logger = new Logger(GenreEntityService.name)
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleEntityService: TitleEntityService,
    ) {}

    async getGenreByTmdbId(tmdbId: bigint): Promise<DbGenre> {
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

    async getGenresForTitle(
        imdbId: string,
        isMovie: boolean,
    ): Promise<Genre[]> {
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

            return GenreMapper.manyToGraphQL(dbGenres)
        } catch (error) {
            this.logger.error(
                `Error fetching genres for imdbId ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async syncGenresForTitle(
        imdbId: string,
        genres: Genre[],
    ): Promise<boolean> {
        try {
            if (!genres.length) return true

            const { movie, series } =
                await this.titleEntityService.findByImdbId(imdbId)

            await this.saveGenres(genres, movie?.id, series?.id)

            return true
        } catch (error) {
            this.logger.error(
                `Failed to sync genres for title with imdbId: ${imdbId} - `,
                error,
            )
            return false
        }
    }

    private async saveGenres(
        genres: Genre[],
        movieId?: bigint,
        seriesId?: bigint,
    ): Promise<void> {
        try {
            if (!movieId && !seriesId) {
                return
            }

            for (const genre of genres) {
                const genreEntity = await this.getGenreByTmdbId(
                    BigInt(genre.tmdbId),
                )

                this.logger.debug(bigIntSerializer.stringify(genreEntity))

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
