import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbTitleTranslation,
    DbTitleTranslationInsert,
    titleTranslations,
} from '@/modules/infrastructure/drizzle/schema/title-translations.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { TitleSupportedLanguagesConfig } from '../../config/title-supported-languages.config'
import { LanguageService } from '../../modules/language/language.service'
import { TmdbTranslation } from '../../modules/tmdb/types/tmdb.interface'

@Injectable()
export class TitleTranslationService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly languageService: LanguageService,
        private readonly languagesConfig: TitleSupportedLanguagesConfig,
    ) {}

    async linkTitleToTranslations(
        tx: DrizzleDB,
        titleId: string,
        translations: TmdbTranslation[],
    ): Promise<void> {
        if (!translations?.length) return

        const supportedLanguages =
            this.languagesConfig.getPostgresLanguageISOCodes()
        const validTranslations = translations.filter(
            (t) => t.iso_639_1 && supportedLanguages.includes(t.iso_639_1),
        )

        await Promise.all(
            validTranslations.map(async (translation) => {
                await this.upsertSingleTranslation(tx, titleId, translation)
            }),
        )
    }

    private async upsertSingleTranslation(
        tx: DrizzleDB,
        titleId: string,
        translation: TmdbTranslation,
    ): Promise<void> {
        const { iso_639_1: iso, data, name, english_name } = translation

        if (!this.languagesConfig.shouldStoreInPostgres(iso)) return

        const language = await this.languageService.findByISO(iso)
        if (!language) return

        const translatedTitle = this.resolveTranslationTitle(
            data,
            name,
            english_name,
        )
        if (!translatedTitle) return

        const translationData = this.buildTranslationData(
            titleId,
            language.id,
            data,
            translatedTitle,
        )

        await tx
            .insert(titleTranslations)
            .values(translationData as DbTitleTranslationInsert)
            .onConflictDoUpdate({
                target: [
                    titleTranslations.titleId,
                    titleTranslations.languageId,
                ],
                set: this.getTranslationUpdateData(data, translatedTitle),
            })
    }

    private resolveTranslationTitle(
        data: TmdbTranslation['data'],
        name?: string,
        englishName?: string,
    ): string | null {
        return (
            [data?.title, name, englishName]
                .map((s) => s?.trim())
                .find((s) => s && s.length > 0) || null
        )
    }

    private buildTranslationData(
        titleId: string,
        languageId: string,
        data: TmdbTranslation['data'],
        title: string,
    ): Partial<DbTitleTranslation> {
        return {
            titleId,
            languageId,
            title,
            overview: data?.overview,
            tagline: data?.tagline,
            homepage: data?.homepage,
        }
    }

    private getTranslationUpdateData(
        data: TmdbTranslation['data'],
        title: string,
    ): Partial<DbTitleTranslation> {
        return {
            title,
            overview: data?.overview,
            tagline: data?.tagline,
            homepage: data?.homepage,
            updatedAt: new Date(),
        }
    }
}
