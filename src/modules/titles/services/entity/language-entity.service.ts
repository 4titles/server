import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Language } from 'src/entities/language.entity'
import { Title } from 'src/entities/title.entity'
import { ILanguage } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'

@Injectable()
export class LanguageEntityService {
    private readonly logger = new Logger(LanguageEntityService.name)

    constructor(
        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,
    ) {}

    async findByLanguageCodes(languageCodes: string[]): Promise<Language[]> {
        if (!languageCodes?.length) return []

        return this.languageRepository.find({
            where: { code: In(languageCodes) },
        })
    }

    async findByTitleImdbId(imdbId: string): Promise<Language[]> {
        return await this.languageRepository.find({
            where: { titles: { imdbId } },
            relations: ['titles'],
        })
    }

    async findOrCreateMany(languages: ILanguage[] = []): Promise<Language[]> {
        if (!languages?.length) return []

        try {
            const uniqueLanguages = Array.from(
                new Map(languages.map((l) => [l.code, l])).values(),
            )
            const existingLanguages = await this.findByLanguageCodes(
                uniqueLanguages.map((l) => l.code),
            )
            const existingLanguageMap = new Map(
                existingLanguages.map((language) => [language.code, language]),
            )
            const languagesToCreate = uniqueLanguages.filter(
                (language) => !existingLanguageMap.has(language.code),
            )

            if (!languagesToCreate.length) {
                return existingLanguages
            }

            const newLanguages = await Promise.all(
                languagesToCreate.map(async (lang) => {
                    try {
                        const language = this.languageRepository.create({
                            code: lang.code,
                            name: lang.name,
                        })
                        return await this.languageRepository.save(language)
                    } catch (error) {
                        const existing = await this.findByLanguageCodes([
                            lang.code,
                        ])

                        if (existing) {
                            return existing[0]
                        }

                        throw error
                    }
                }),
            )

            return [...existingLanguages, ...newLanguages.filter(Boolean)]
        } catch (error) {
            this.logger.error(
                'Failed to find or create languages:',
                error.stack,
            )
            throw error
        }
    }

    async updateMany(
        title: Title,
        languages: ILanguage[],
    ): Promise<Language[]> {
        if (!languages?.length) return []

        try {
            const currentLanguages = await this.findByTitleImdbId(title.imdbId)

            if (!currentLanguages.length) {
                return []
            }

            const currentLanguageMap = new Map(
                currentLanguages.map((lang) => [lang.code, lang]),
            )

            const updates = languages
                .map((newLang) => {
                    const existing = currentLanguageMap.get(newLang.code)
                    if (!existing) return null

                    let needsUpdate = false

                    if (existing.code !== newLang.code) {
                        existing.code = newLang.code
                        needsUpdate = true
                    }

                    if (existing.name !== newLang.name) {
                        existing.name = newLang.name
                        needsUpdate = true
                    }

                    return needsUpdate ? existing : null
                })
                .filter(Boolean)

            if (updates.length) {
                await this.languageRepository.save(updates)
                this.logger.debug(
                    `Updated languages for title ${title.imdbId}: ` +
                        `processed ${updates.length} languages`,
                )
            }

            return updates
        } catch (error) {
            this.logger.error(
                `Failed to update languages for title ${title.imdbId}:`,
                error.stack,
            )
            throw error
        }
    }
}
