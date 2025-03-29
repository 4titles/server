import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleCountries } from '@/modules/infrastructure/drizzle/schema/title-countries.schema'
import { titleFilmingLocations } from '@/modules/infrastructure/drizzle/schema/title-filming-locations.schema'
import { titleGenres } from '@/modules/infrastructure/drizzle/schema/title-genres.schema'
import { titleLanguages } from '@/modules/infrastructure/drizzle/schema/title-languages.schema'
import { titleTranslations } from '@/modules/infrastructure/drizzle/schema/title-translations.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { titleImages } from '../../../../infrastructure/drizzle/schema/title-images.schema'
import {
    ExtendedShowResponse,
    TmdbTitleExtendedResponse,
} from '../../modules/tmdb/types/tmdb.interface'
import { TitleCountryService } from './title-country.service'
import { TitleFilmingLocationService } from './title-filming-location.service'
import { TitleGenreService } from './title-genre.service'
import { TitleImageService } from './title-image.service'
import { TitleLanguageService } from './title-language.service'
import { TitleTranslationService } from './title-translation.service'

@Injectable()
export class TitleRelationService {
    constructor(
        private readonly titleGenreService: TitleGenreService,
        private readonly titleCountryService: TitleCountryService,
        private readonly titleLanguageService: TitleLanguageService,
        private readonly titleTranslationService: TitleTranslationService,
        private readonly titleFilmingLocationService: TitleFilmingLocationService,
        private readonly titleImageService: TitleImageService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async createTitleRelations(
        titleId: string,
        detailedInfo: TmdbTitleExtendedResponse,
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            await Promise.all([
                this.titleGenreService.linkTitleToGenres(
                    tx,
                    titleId,
                    detailedInfo.genres,
                ),
                this.titleCountryService.linkTitleToCountries(
                    tx,
                    titleId,
                    detailedInfo.production_countries,
                    (detailedInfo as ExtendedShowResponse).origin_country,
                ),
                this.titleLanguageService.linkTitleToLanguages(
                    tx,
                    titleId,
                    detailedInfo.spoken_languages,
                    detailedInfo.original_language,
                ),
                this.titleTranslationService.linkTitleToTranslations(
                    tx,
                    titleId,
                    detailedInfo.translations.translations,
                ),
                this.titleImageService.linkTitleToImages(
                    tx,
                    titleId,
                    detailedInfo.images,
                ),
            ])
        })
    }

    async createFilmingLocationRelations(
        titleId: string,
        locationIds: string[],
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            await this.titleFilmingLocationService.linkTitleToFilmingLocations(
                tx,
                titleId,
                locationIds,
            )
        })
    }

    async updateTitleRelations(
        titleId: string,
        detailedInfo: TmdbTitleExtendedResponse,
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            await this.deleteExistingRelations(tx, titleId)
            await this.createTitleRelations(titleId, detailedInfo)
        })
    }

    async deleteExistingRelations(
        tx: DrizzleDB,
        titleId: string,
    ): Promise<void> {
        await Promise.all([
            tx.delete(titleGenres).where(eq(titleGenres.titleId, titleId)),
            tx
                .delete(titleCountries)
                .where(eq(titleCountries.titleId, titleId)),
            tx
                .delete(titleLanguages)
                .where(eq(titleLanguages.titleId, titleId)),
            tx
                .delete(titleTranslations)
                .where(eq(titleTranslations.titleId, titleId)),
            tx
                .delete(titleFilmingLocations)
                .where(eq(titleFilmingLocations.titleId, titleId)),
            tx.delete(titleImages).where(eq(titleImages.titleId, titleId)),
        ])
    }

    async deleteAllRelations(): Promise<void> {
        await this.db.transaction(async (tx) => {
            await Promise.all([
                tx.delete(titleGenres),
                tx.delete(titleCountries),
                tx.delete(titleLanguages),
                tx.delete(titleTranslations),
                tx.delete(titleFilmingLocations),
                tx.delete(titleImages),
            ])
        })
    }
}
