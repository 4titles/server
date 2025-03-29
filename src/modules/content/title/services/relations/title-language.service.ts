import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { titleLanguages } from '@/modules/infrastructure/drizzle/schema/title-languages.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { TitleLanguageType } from '../../enums/title-language-type.enum'
import { LanguageService } from '../../modules/language/language.service'
import { TmdbLanguage } from '../../modules/tmdb/models/tmdb-language.model'

@Injectable()
export class TitleLanguageService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly languageService: LanguageService,
    ) {}

    async linkTitleToLanguages(
        tx: DrizzleDB,
        titleId: string,
        spokenLanguages: TmdbLanguage[],
        originalLanguage?: string,
    ): Promise<void> {
        const relations = []

        if (spokenLanguages?.length) {
            const languageIds = await this.languageService.getIdsByISO(
                spokenLanguages.map((l) => l.iso_639_1),
            )
            relations.push(
                ...languageIds.map((languageId) => ({
                    titleId,
                    languageId,
                    type: TitleLanguageType.SPOKEN,
                })),
            )
        }

        if (originalLanguage) {
            const languageId =
                await this.languageService.findByISO(originalLanguage)
            if (languageId) {
                relations.push({
                    titleId,
                    languageId: languageId.id,
                    type: TitleLanguageType.ORIGINAL,
                })
            }
        }

        if (relations.length) {
            await tx.insert(titleLanguages).values(relations)
        }
    }
}
