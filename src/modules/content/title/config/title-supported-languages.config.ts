import { Injectable } from '@nestjs/common'
import { TitleSupportedLanguage } from '../enums/title-supported-languages.enum'

export interface LanguageConfig {
    iso: string
    name: string
    storageStrategy: 'full' | 'essential' | 'metadata'
    priority: number
}

/**
 * full: full data in PostgreSQL + Elasticsearch
 * essential: base data in PostgreSQL, full in ElasticSearch
 * metadata: only ElasticSearch
 */
@Injectable()
export class TitleSupportedLanguagesConfig {
    private readonly languages: LanguageConfig[] = [
        {
            iso: TitleSupportedLanguage.EN,
            name: 'English',
            storageStrategy: 'full',
            priority: 100,
        },
        {
            iso: TitleSupportedLanguage.RU,
            name: 'Russian',
            storageStrategy: 'full',
            priority: 90,
        },
        {
            iso: TitleSupportedLanguage.ES,
            name: 'Spanish',
            storageStrategy: 'essential',
            priority: 80,
        },
        {
            iso: TitleSupportedLanguage.FR,
            name: 'French',
            storageStrategy: 'essential',
            priority: 70,
        },
        {
            iso: TitleSupportedLanguage.DE,
            name: 'German',
            storageStrategy: 'essential',
            priority: 60,
        },
        {
            iso: TitleSupportedLanguage.IT,
            name: 'Italian',
            storageStrategy: 'essential',
            priority: 50,
        },
        {
            iso: TitleSupportedLanguage.ZH,
            name: 'Chinese',
            storageStrategy: 'essential',
            priority: 40,
        },
        {
            iso: TitleSupportedLanguage.JA,
            name: 'Japanese',
            storageStrategy: 'essential',
            priority: 30,
        },
        {
            iso: TitleSupportedLanguage.PT,
            name: 'Portuguese',
            storageStrategy: 'metadata',
            priority: 6,
        },
        {
            iso: TitleSupportedLanguage.KO,
            name: 'Korean',
            storageStrategy: 'metadata',
            priority: 5,
        },
        {
            iso: TitleSupportedLanguage.TR,
            name: 'Turkish',
            storageStrategy: 'metadata',
            priority: 4,
        },
        {
            iso: TitleSupportedLanguage.HI,
            name: 'Hindi',
            storageStrategy: 'metadata',
            priority: 3,
        },
        {
            iso: TitleSupportedLanguage.TH,
            name: 'Thai',
            storageStrategy: 'metadata',
            priority: 2,
        },
        {
            iso: TitleSupportedLanguage.ID,
            name: 'Indonesian',
            storageStrategy: 'metadata',
            priority: 1,
        },
    ]

    getAllLanguages(): LanguageConfig[] {
        return [...this.languages]
    }

    getPostgresLanguages(): LanguageConfig[] {
        return this.languages.filter(
            (lang) =>
                lang.storageStrategy === 'full' ||
                lang.storageStrategy === 'essential',
        )
    }

    getFullSupportLanguages(): LanguageConfig[] {
        return this.languages.filter((lang) => lang.storageStrategy === 'full')
    }

    getPostgresLanguageISOCodes(): string[] {
        return this.getPostgresLanguages().map((lang) => lang.iso)
    }

    shouldStoreInPostgres(iso: string): boolean {
        const lang = this.languages.find((l) => l.iso === iso)
        return lang
            ? lang.storageStrategy === 'full' ||
                  lang.storageStrategy === 'essential'
            : false
    }

    shouldStoreFullDataInPostgres(iso: string): boolean {
        const lang = this.languages.find((l) => l.iso === iso)
        return lang ? lang.storageStrategy === 'full' : false
    }

    getLanguageByISO(iso: string): LanguageConfig | undefined {
        return this.languages.find((l) => l.iso === iso)
    }
}
