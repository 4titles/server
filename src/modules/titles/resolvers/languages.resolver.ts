import { Args, Query, Resolver } from '@nestjs/graphql'
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

    @Query(() => Language, {
        nullable: true,
        description: 'Get a language by ISO code',
    })
    async language(@Args('iso', { type: () => String }) iso: string) {
        return await this.languageService.getLanguageByIso(iso)
    }
}
