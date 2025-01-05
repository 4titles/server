import { Query, Resolver } from '@nestjs/graphql'
import { Language } from '../models/language.model'
import { LanguageService } from '../services'

@Resolver(() => Language)
export class LanguagesResolver {
    constructor(private readonly languageService: LanguageService) {}

    @Query(() => [Language], {
        description: 'Get a list of all languages',
    })
    async languages(): Promise<Language[]> {
        return await this.languageService.getAll()
    }
}
