import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbLanguage,
    languages,
} from '@/modules/infrastructure/drizzle/schema/languages.schema'
import { titles } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { asc, eq } from 'drizzle-orm'
import { TmdbLanguage } from '../tmdb/models/tmdb-language.model'
import { TmdbService } from '../tmdb/tmdb.service'
import { CreateLanguageInput } from './inputs/create-language.input'
import { Language } from './models/language.model'

@Injectable()
export class LanguageService {
    private readonly logger: Logger = new Logger(LanguageService.name)

    constructor(
        private readonly tmdbService: TmdbService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async findById(id: string): Promise<Language> {
        return await this.db.query.languages.findFirst({
            where: eq(languages.id, id),
        })
    }

    async findByISO(iso: string): Promise<Language> {
        return await this.db.query.languages.findFirst({
            where: eq(languages.iso, iso),
        })
    }

    async findByEnglishName(englishName: string): Promise<Language> {
        return await this.db.query.languages.findFirst({
            where: eq(languages.englishName, englishName),
        })
    }

    async findByNativeName(nativeName: string): Promise<Language> {
        return await this.db.query.languages.findFirst({
            where: eq(languages.nativeName, nativeName),
        })
    }

    async findAll(): Promise<Language[]> {
        return await this.db.query.languages.findMany({
            orderBy: [asc(languages.iso)],
            with: {},
        })
    }

    async findAllWithRelations() {
        return await this.db.query.languages.findMany({
            orderBy: [asc(languages.iso)],
            with: {
                titles: {
                    orderBy: [asc(titles.popularity)],
                },
            },
        })
    }

    async getLanguagesListFromTmdb(): Promise<TmdbLanguage[]> {
        return await this.tmdbService.getLanguages()
    }

    async create(input: CreateLanguageInput): Promise<boolean> {
        const { iso, englishName, nativeName } = input

        const newLanguage = {
            iso,
            englishName,
            nativeName,
        }

        await this.db.insert(languages).values(newLanguage)

        return true
    }

    async upsert(input: CreateLanguageInput): Promise<boolean> {
        const { iso, englishName, nativeName } = input

        const language = {
            iso,
            englishName,
            nativeName,
        }

        await this.db
            .insert(languages)
            .values(language)
            .onConflictDoUpdate({
                target: languages.iso,
                set: { englishName, nativeName } as Partial<DbLanguage>,
            })

        return true
    }

    async createMany(
        languagesToCreate: CreateLanguageInput[],
    ): Promise<number> {
        const createdLanguages = await Promise.all(
            languagesToCreate.map((language) => this.upsert(language)),
        )

        return createdLanguages?.length || 0
    }
}
