import { Inject, Injectable, Logger } from '@nestjs/common'
import { DrizzleDB } from '../types/drizzle'
import { TmdbService } from '@/modules/tmdb/tmdb.service'
import { genres } from '../schema/genres.schema'
import { DRIZZLE } from '../drizzle.module'

export interface GenreData {
    id: number
    names: {
        en: string
        ru: string
    }
}

@Injectable()
export class GenreSeeder {
    private readonly logger: Logger = new Logger(GenreSeeder.name)

    constructor(
        private readonly tmdbService: TmdbService,
        @Inject(DRIZZLE) protected db: DrizzleDB,
    ) {}

    async seed() {
        try {
            const [movieGenres, tvGenres] = await Promise.all([
                this.tmdbService.getMovieGenres(),
                this.tmdbService.getTvGenres(),
            ])

            const uniqueGenres = new Map<number, GenreData>()

            movieGenres.en.genres.forEach((enGenre) => {
                const ruGenre = movieGenres.ru.genres.find(
                    (g) => g.id === enGenre.id,
                )
                if (ruGenre) {
                    uniqueGenres.set(enGenre.id, {
                        id: enGenre.id,
                        names: {
                            en: enGenre.name,
                            ru: ruGenre.name,
                        },
                    })
                }
            })

            tvGenres.en.genres.forEach((enGenre) => {
                const ruGenre = tvGenres.ru.genres.find(
                    (g) => g.id === enGenre.id,
                )
                if (ruGenre) {
                    if (!uniqueGenres.has(enGenre.id)) {
                        uniqueGenres.set(enGenre.id, {
                            id: enGenre.id,
                            names: {
                                en: enGenre.name,
                                ru: ruGenre.name,
                            },
                        })
                    } else {
                        const existingGenre = uniqueGenres.get(enGenre.id)!
                        if (
                            existingGenre.names.en !== enGenre.name ||
                            existingGenre.names.ru !== ruGenre.name
                        ) {
                            this.logger.warn(
                                `Genre ID ${enGenre.id} has different names in movies and TV shows:`,
                                {
                                    movies: existingGenre.names,
                                    tvShows: {
                                        en: enGenre.name,
                                        ru: ruGenre.name,
                                    },
                                },
                            )
                        }
                    }
                }
            })

            const genresToInsert = Array.from(uniqueGenres.values()).map(
                (genre) => ({
                    tmdbId: BigInt(genre.id),
                    names: genre.names,
                    updatedAt: new Date(),
                }),
            )

            await this.db.delete(genres)

            await this.db.insert(genres).values(genresToInsert)

            this.logger.log(
                `Successfully seeded ${genresToInsert.length} genres`,
            )
        } catch (error) {
            this.logger.error('Failed to seed genres:', error)
            throw error
        }
    }
}
