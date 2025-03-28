import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbGenre,
    genres,
} from '@/modules/infrastructure/drizzle/schema/genres.schema'
import { titles } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { asc, eq, inArray } from 'drizzle-orm'
import { MovieDb } from 'moviedb-promise'
import { TmdbService } from '../tmdb/tmdb.service'
import { CreateGenreInput } from './inputs/create-genre.input'
import { Genre } from './models/genre.model'
import { GenresByLanguage } from './models/genres-by-language.model'

@Injectable()
export class GenreService {
    private readonly supportedLanguages = ['en', 'ru']
    private readonly logger: Logger = new Logger(GenreService.name)

    constructor(
        private readonly tmdbService: TmdbService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async findById(id: string): Promise<Genre> {
        return await this.db.query.genres.findFirst({
            where: eq(genres.id, id),
        })
    }

    async findByTmdbId(tmdbId: string): Promise<Genre> {
        return await this.db.query.genres.findFirst({
            where: eq(genres.tmdbId, tmdbId),
        })
    }

    async findByName(name: string): Promise<Genre> {
        return await this.db.query.genres.findFirst({
            where: eq(genres.name, name),
        })
    }

    async findAll(): Promise<Genre[]> {
        return await this.db.query.genres.findMany({
            orderBy: [asc(genres.name)],
        })
    }

    async findAllWithRelations() {
        return await this.db.query.genres.findMany({
            orderBy: [asc(genres.name)],
            with: { titles: { orderBy: [asc(titles.popularity)] } },
        })
    }

    async getIdsByTmdbIds(tmdbIds: string[]): Promise<string[]> {
        const dbGenres = await this.db.query.genres.findMany({
            where: inArray(genres.tmdbId, tmdbIds),
        })

        return dbGenres.map((g) => g.id)
    }

    async getGenresListFromTmdb(): Promise<GenresByLanguage> {
        try {
            const result: GenresByLanguage = {}
            const movieDb: MovieDb = await this.tmdbService.getMovieDb()

            const movieGenresPromises = this.supportedLanguages.map((lang) =>
                movieDb
                    .genreMovieList({ language: lang })
                    .then((response) => ({ language: lang, data: response })),
            )

            const tvGenresPromises = this.supportedLanguages.map((lang) =>
                movieDb
                    .genreTvList({ language: lang })
                    .then((response) => ({ language: lang, data: response })),
            )

            const [movieGenresResponses, tvGenresResponses] = await Promise.all(
                [
                    Promise.all(movieGenresPromises),
                    Promise.all(tvGenresPromises),
                ],
            )

            for (const lang of this.supportedLanguages) {
                result[lang] = []
            }

            for (const response of movieGenresResponses) {
                const { language, data } = response
                if (data.genres) {
                    result[language] = [...result[language], ...data.genres]
                }
            }

            for (const response of tvGenresResponses) {
                const { language, data } = response
                if (data.genres) {
                    const existingIds = new Set(
                        result[language].map((genre) => genre.id),
                    )
                    const uniqueTvGenres = data.genres.filter(
                        (genre) => !existingIds.has(genre.id),
                    )
                    result[language] = [...result[language], ...uniqueTvGenres]
                }
            }

            return result
        } catch (error) {
            this.logger.error('Failed to fetch genres from TMDB', error)
            throw new Error(
                `Failed to fetch genres from TMDB: ${error.message}`,
            )
        }
    }

    async create(input: CreateGenreInput): Promise<boolean> {
        const { tmdbId, names } = input

        const newGenre = {
            tmdbId,
            name: names.ru,
            englishName: names.en,
        }

        await this.db.insert(genres).values(newGenre).onConflictDoNothing()

        return true
    }

    async upsert(input: CreateGenreInput): Promise<boolean> {
        const { tmdbId, names } = input

        const genre = {
            tmdbId,
            name: names.ru,
            englishName: names.en,
        }

        await this.db
            .insert(genres)
            .values(genre)
            .onConflictDoUpdate({
                target: genres.tmdbId,
                set: {
                    name: names.ru,
                    englishName: names.en,
                } as Partial<DbGenre>,
            })

        return true
    }

    async createMany(genresToCreate: CreateGenreInput[]): Promise<number> {
        const createdGenres = await Promise.all(
            genresToCreate.map((genre) => this.upsert(genre)),
        )

        return createdGenres.length
    }
}
