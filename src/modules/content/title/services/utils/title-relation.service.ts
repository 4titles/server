import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleCountries } from '@/modules/infrastructure/drizzle/schema/title-countries.schema'
import { titleFilmingLocations } from '@/modules/infrastructure/drizzle/schema/title-filming-locations.schema'
import { titleGenres } from '@/modules/infrastructure/drizzle/schema/title-genres.schema'
import { titleLanguages } from '@/modules/infrastructure/drizzle/schema/title-languages.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { TitleLanguageType } from '../../enums/title-language-type.enum'
import { CountryService } from '../../modules/country/country.service'
import { CountryRelation } from '../../modules/country/enums/country-relation.enum'
import { GenreService } from '../../modules/genre/genre.service'
import { LanguageService } from '../../modules/language/language.service'
import { TmdbCountry } from '../../modules/tmdb/models/tmdb-country.model'
import { TmdbGenre } from '../../modules/tmdb/models/tmdb-genre.model'
import { TmdbLanguage } from '../../modules/tmdb/models/tmdb-language.model'
import {
    ExtendedShowResponse,
    TmdbTitleExtendedResponse,
} from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleRelationService {
    private readonly logger = new Logger(TitleRelationService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly genreService: GenreService,
        private readonly countryService: CountryService,
        private readonly languageService: LanguageService,
    ) {}

    async createTitleRelations(
        titleId: string,
        detailedInfo: TmdbTitleExtendedResponse,
    ): Promise<void> {
        await Promise.all([
            this.createGenreRelations(titleId, detailedInfo.genres),
            this.createCountryRelations(
                titleId,
                detailedInfo.production_countries,
                (detailedInfo as ExtendedShowResponse).origin_country,
            ),
            this.createLanguageRelations(
                titleId,
                detailedInfo.spoken_languages,
                detailedInfo.original_language,
            ),
        ])
    }

    async updateTitleRelations(
        titleId: string,
        detailedInfo: TmdbTitleExtendedResponse,
    ): Promise<void> {
        await Promise.all([
            this.db.delete(titleGenres).where(eq(titleGenres.titleId, titleId)),
            this.db
                .delete(titleCountries)
                .where(eq(titleCountries.titleId, titleId)),
            this.db
                .delete(titleLanguages)
                .where(eq(titleLanguages.titleId, titleId)),
        ])

        await this.createTitleRelations(titleId, detailedInfo)
    }

    private async createGenreRelations(
        titleId: string,
        genres: TmdbGenre[],
    ): Promise<void> {
        if (!genres || !genres.length) return

        const relations = []

        for (const genre of genres) {
            const dbGenre = await this.genreService.findByTmdbId(
                genre.id.toString(),
            )
            if (dbGenre) {
                relations.push({
                    titleId,
                    genreId: dbGenre.id,
                })
            }
        }

        if (relations.length) {
            await this.db.insert(titleGenres).values(relations)
        }
    }

    private async createCountryRelations(
        titleId: string,
        productionCountries: TmdbCountry[],
        originCountries?: string[],
    ): Promise<void> {
        const relations = []

        if (productionCountries && productionCountries.length) {
            for (const country of productionCountries) {
                const dbCountry = await this.countryService.findByISO(
                    country.iso_3166_1,
                )
                if (dbCountry) {
                    relations.push({
                        titleId,
                        countryId: dbCountry.id,
                        type: CountryRelation.PRODUCTION,
                    })
                }
            }
        }

        if (originCountries && originCountries.length) {
            for (const iso of originCountries) {
                const dbCountry = await this.countryService.findByISO(iso)
                if (dbCountry) {
                    const existingRelation = relations.find(
                        (r) =>
                            r.countryId === dbCountry.id &&
                            r.type === CountryRelation.PRODUCTION,
                    )

                    if (!existingRelation) {
                        relations.push({
                            titleId,
                            countryId: dbCountry.id,
                            type: CountryRelation.ORIGIN,
                        })
                    }
                }
            }
        }

        if (relations.length) {
            await this.db.insert(titleCountries).values(relations)
        }
    }

    private async createLanguageRelations(
        titleId: string,
        spokenLanguages: TmdbLanguage[],
        originalLanguage?: string,
    ): Promise<void> {
        const relations = []
        const supportedLanguages = ['en', 'ru']

        if (spokenLanguages && spokenLanguages.length) {
            for (const language of spokenLanguages) {
                const langCode = language.iso_639_1

                if (!supportedLanguages.includes(langCode)) continue

                const dbLanguage =
                    await this.languageService.findByISO(langCode)
                if (dbLanguage) {
                    relations.push({
                        titleId,
                        languageId: dbLanguage.id,
                        type: TitleLanguageType.SPOKEN,
                    })
                }
            }
        }

        if (originalLanguage && supportedLanguages.includes(originalLanguage)) {
            const dbLanguage =
                await this.languageService.findByISO(originalLanguage)
            if (dbLanguage) {
                relations.push({
                    titleId,
                    languageId: dbLanguage.id,
                    type: TitleLanguageType.ORIGINAL,
                })
            }
        }

        if (relations.length) {
            await this.db.insert(titleLanguages).values(relations)
        }
    }

    async createFilmingLocationRelations(
        titleId: string,
        locationIds: string[],
    ): Promise<void> {
        if (!locationIds.length) return

        await this.db
            .delete(titleFilmingLocations)
            .where(eq(titleFilmingLocations.titleId, titleId))

        await Promise.all(
            locationIds.map((locationId) =>
                this.db
                    .insert(titleFilmingLocations)
                    .values({
                        titleId,
                        filmingLocationId: locationId,
                    })
                    .onConflictDoNothing({
                        target: [
                            titleFilmingLocations.titleId,
                            titleFilmingLocations.filmingLocationId,
                        ],
                    }),
            ),
        )
    }

    async deleteAllRelations(): Promise<void> {
        await Promise.all([
            this.db.delete(titleGenres),
            this.db.delete(titleCountries),
            this.db.delete(titleLanguages),
            this.db.delete(titleFilmingLocations),
        ])
    }
}
