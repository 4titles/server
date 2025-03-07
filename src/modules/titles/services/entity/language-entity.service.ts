import { Inject, Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleDB } from '../../../drizzle/types/drizzle'
import {
    DbLanguage,
    languages,
    movieLanguages,
    seriesLanguages,
} from '../../../drizzle/schema/languages.schema'
import { MovieLanguageType } from '../../enums/movie-language-type.enum'
import { SeriesLanguageType } from '../../enums/series-language-type.enum'
import { Language } from '../../models/language.model'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DatabaseException } from '../../exceptions/database.exception'
import { DEFAULT_FETCH_LIMIT } from '../constants/query.constants'
import {
    DbMovieLanguageResult,
    DbSeriesLanguageResult,
} from '../../types/language.type'

@Injectable()
export class LanguageEntityService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async getAll(): Promise<DbLanguage[]> {
        try {
            return await this.db.query.languages.findMany({
                limit: DEFAULT_FETCH_LIMIT,
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to fetch all languages: ${error.message}`,
            )
        }
    }

    async getByIso(iso: string): Promise<DbLanguage> {
        try {
            return await this.db.query.languages.findFirst({
                where: eq(languages.iso, iso),
            })
        } catch (error) {
            throw new DatabaseException(
                `Failed to fetch language by iso ${iso}: ${error.message}`,
            )
        }
    }

    async createOrUpdate(language: Language): Promise<DbLanguage[]> {
        try {
            const existing = await this.getByIso(language.iso)

            if (existing) {
                return this.db
                    .update(languages)
                    .set(language)
                    .where(eq(languages.id, existing.id))
                    .returning()
            }

            return this.db.insert(languages).values(language).returning()
        } catch (error) {
            throw new DatabaseException(
                `Failed to create/update language: ${error.message}`,
            )
        }
    }

    async getForMovie(movieId: bigint): Promise<DbMovieLanguageResult[]> {
        return await this.db.query.movieLanguages.findMany({
            where: eq(movieLanguages.movieId, movieId),
            with: {
                language: true,
            },
        })
    }

    async getForSeries(seriesId: bigint): Promise<DbSeriesLanguageResult[]> {
        return await this.db.query.seriesLanguages.findMany({
            where: eq(seriesLanguages.seriesId, seriesId),
            with: {
                language: true,
            },
        })
    }

    async saveMovieLanguages(
        movieId: bigint,
        languageIds: number[],
        type: MovieLanguageType,
    ) {
        await this.db
            .delete(movieLanguages)
            .where(
                and(
                    eq(movieLanguages.movieId, movieId),
                    eq(movieLanguages.type, type),
                ),
            )

        return this.db.insert(movieLanguages).values(
            languageIds.map((languageId) => ({
                movieId,
                languageId,
                type,
            })),
        )
    }

    async saveSeriesLanguages(
        seriesId: bigint,
        languageIds: number[],
        type: SeriesLanguageType,
    ) {
        await this.db
            .delete(seriesLanguages)
            .where(
                and(
                    eq(seriesLanguages.seriesId, seriesId),
                    eq(seriesLanguages.type, type),
                ),
            )

        return this.db.insert(seriesLanguages).values(
            languageIds.map((languageId) => ({
                seriesId,
                languageId,
                type,
            })),
        )
    }
}
