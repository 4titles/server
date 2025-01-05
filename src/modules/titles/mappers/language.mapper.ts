import { DbLanguage } from '../../drizzle/schema/languages.schema'
import { Language } from '../models/language.model'

export class LanguageMapper {
    static toGraphQL(language: DbLanguage): Language {
        return {
            id: Number(language.id),
            iso: language.iso,
            englishName: language.englishName,
            name: language.name || undefined,
        }
    }

    static manyToGraphQL(languages: DbLanguage[]): Language[] {
        return languages.map(this.toGraphQL)
    }
}
