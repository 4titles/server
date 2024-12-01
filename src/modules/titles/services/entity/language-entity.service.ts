import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Language } from 'src/entities/language.entity'
import { Title } from 'src/entities/title.entity'
import { ILanguage } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'

@Injectable()
export class LanguageEntityService {
    constructor(
        @InjectRepository(Language)
        private readonly languageRepository: Repository<Language>,
        @InjectRepository(Title)
        private readonly titleRepository: Repository<Title>,
    ) {}

    async findByLanguageCodes(languageCodes: string[]): Promise<Language[]> {
        if (!languageCodes?.length) return []

        return this.languageRepository.find({
            where: { code: In(languageCodes) },
        })
    }

    async findOrCreateMany(languages: ILanguage[] = []): Promise<Language[]> {
        if (!languages?.length) return []

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

        const languagePromises = languagesToCreate.map(async (lang) => {
            try {
                const language = this.languageRepository.create({
                    code: lang.code,
                    name: lang.name,
                })
                return await this.languageRepository.save(language)
            } catch {
                const existing = await this.findByLanguageCodes([lang.code])
                return existing[0]
            }
        })

        const newLanguages = await Promise.all(languagePromises)

        return [...existingLanguages, ...newLanguages.filter(Boolean)]
    }

    async updateMany(languages: ILanguage[]): Promise<void> {
        if (!languages?.length) return

        const existingLanguages = await this.findByLanguageCodes(
            languages.map((l) => l.code),
        )

        const updates = existingLanguages
            .map((existing) => {
                const newData = languages.find((l) => l.code === existing.code)
                if (newData && newData.name !== existing.name) {
                    existing.name = newData.name
                    return existing
                }
                return null
            })
            .filter(Boolean)

        if (updates.length) {
            await this.languageRepository.save(updates)
        }
    }

    async updateTitleLanguages(
        title: Title,
        languages: ILanguage[],
    ): Promise<void> {
        if (!languages?.length) return

        const languageEntities = await this.findOrCreateMany(languages)
        await this.updateMany(languages)

        await this.titleRepository
            .createQueryBuilder()
            .relation(Title, 'spokenLanguages')
            .of(title)
            .addAndRemove(
                languageEntities.map((l) => l.id),
                title.spokenLanguages?.map((l) => l.id) || [],
            )
    }
}
