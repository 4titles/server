import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFilmingLocationDescription,
    DbFilmingLocationDescriptionInsert,
    filmingLocationDescriptions,
} from '@/modules/infrastructure/drizzle/schema/filming-location-descriptions.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { TitleSupportedLanguage } from '../../../enums/title-supported-languages.enum'
import { LanguageService } from '../../../modules/language/language.service'
import { Language } from '../../../modules/language/models/language.model'

@Injectable()
export class FilmingLocationDescriptionService {
    private readonly logger = new Logger(FilmingLocationDescriptionService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly languageService: LanguageService,
    ) {}

    async createDescription(
        filmingLocationId: string,
        languageIso: string,
        description: string,
    ): Promise<DbFilmingLocationDescription | null> {
        try {
            const language = await this.languageService.findByISO(languageIso)
            if (!language) {
                this.logger.warn(`Language with ISO ${languageIso} not found`)
                return null
            }

            const existingDescription = await this.findByLocationAndLanguage(
                filmingLocationId,
                language.id,
            )

            if (existingDescription) {
                const [updatedDescription] = await this.db
                    .update(filmingLocationDescriptions)
                    .set({
                        description,
                        updatedAt: new Date(),
                    } as Partial<DbFilmingLocationDescription>)
                    .where(
                        and(
                            eq(
                                filmingLocationDescriptions.filmingLocationId,
                                filmingLocationId,
                            ),
                            eq(
                                filmingLocationDescriptions.languageId,
                                language.id,
                            ),
                        ),
                    )
                    .returning()

                return updatedDescription
            }

            const descriptionData: DbFilmingLocationDescriptionInsert = {
                filmingLocationId,
                languageId: language.id,
                description,
            }

            const [newDescription] = await this.db
                .insert(filmingLocationDescriptions)
                .values(descriptionData)
                .returning()

            return newDescription
        } catch (error) {
            this.logger.error(
                `Failed to create/update description for location ${filmingLocationId}:`,
                error.stack,
            )
            return null
        }
    }

    async findByLocationAndLanguage(
        filmingLocationId: string,
        languageId: string,
    ): Promise<DbFilmingLocationDescription | null> {
        try {
            return await this.db.query.filmingLocationDescriptions.findFirst({
                where: and(
                    eq(
                        filmingLocationDescriptions.filmingLocationId,
                        filmingLocationId,
                    ),
                    eq(filmingLocationDescriptions.languageId, languageId),
                ),
                with: {
                    language: true,
                },
            })
        } catch (error) {
            this.logger.error(
                `Failed to find description for location ${filmingLocationId} and language ${languageId}:`,
                error.stack,
            )
            return null
        }
    }

    async findByLocationId(
        filmingLocationId: string,
    ): Promise<DbFilmingLocationDescription[]> {
        try {
            return await this.db.query.filmingLocationDescriptions.findMany({
                where: eq(
                    filmingLocationDescriptions.filmingLocationId,
                    filmingLocationId,
                ),
                with: {
                    language: true,
                },
            })
        } catch (error) {
            this.logger.error(
                `Failed to find descriptions for location ${filmingLocationId}:`,
                error.stack,
            )
            return []
        }
    }

    async getDescriptionByLocationAndLanguageIso(
        filmingLocationId: string,
        languageIso: string,
    ): Promise<string | null> {
        try {
            const language = await this.languageService.findByISO(languageIso)
            if (!language) {
                return null
            }

            const description = await this.findByLocationAndLanguage(
                filmingLocationId,
                language.id,
            )

            return description?.description || null
        } catch (error) {
            this.logger.error(
                `Failed to get description for location ${filmingLocationId} and language ${languageIso}:`,
                error.stack,
            )
            return null
        }
    }

    async getPreferredDescription(
        filmingLocationId: string,
        preferredLanguageIso: string,
    ): Promise<string | null> {
        const preferredDescription =
            await this.getDescriptionByLocationAndLanguageIso(
                filmingLocationId,
                preferredLanguageIso,
            )

        if (preferredDescription) {
            return preferredDescription
        }

        if (preferredLanguageIso !== TitleSupportedLanguage.EN) {
            const englishDescription =
                await this.getDescriptionByLocationAndLanguageIso(
                    filmingLocationId,
                    TitleSupportedLanguage.EN,
                )
            if (englishDescription) {
                return englishDescription
            }
        }

        const descriptions = await this.findByLocationId(filmingLocationId)
        if (descriptions.length > 0) {
            return descriptions[0].description
        }

        return null
    }
}
