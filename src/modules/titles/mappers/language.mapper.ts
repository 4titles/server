import { DbLanguage } from '../../drizzle/schema/languages.schema'
import { Language } from '../models/language.model'

export class LanguageMapper {
    static toGraphQL(language: DbLanguage): Language {
        console.log(`One to graphql: ${JSON.stringify(language)}`)
        return {
            id: Number(language.id),
            iso: language.iso,
            englishName: language.englishName,
            name: language.name || undefined,
        }
    }

    static manyToGraphQL(languages: DbLanguage[]): Language[] {
        console.log(`Many to graphql: ${JSON.stringify(languages)}`)
        return languages.map(this.toGraphQL)
    }
}
