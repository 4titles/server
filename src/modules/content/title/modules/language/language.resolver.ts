import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { TmdbLanguage } from '../tmdb/models/tmdb-language.model'
import { CreateLanguageInput } from './inputs/create-language.input'
import { LanguageService } from './language.service'
import { Language } from './models/language.model'

@Resolver(() => Language)
export class LanguageResolver {
    constructor(private readonly languageService: LanguageService) {}

    @Query(() => Language)
    async findLanguageById(@Args('id') id: string) {
        return this.languageService.findById(id)
    }

    @Query(() => Language)
    async findLanguageByISO(@Args('iso') iso: string) {
        return this.languageService.findByISO(iso)
    }

    @Query(() => Language)
    async findLanguageByEnglishName(
        @Args('englishName') englishName: string,
    ): Promise<Language> {
        return await this.languageService.findByEnglishName(englishName)
    }

    @Query(() => Language)
    async findLanguageByNativeName(
        @Args('nativeName') nativeName: string,
    ): Promise<Language> {
        return await this.languageService.findByNativeName(nativeName)
    }

    @Query(() => [Language])
    async findAllLanguages(): Promise<Language[]> {
        return await this.languageService.findAll()
    }

    @Query(() => [Language])
    async findAllLanguagesWithRelations() {
        return await this.languageService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TmdbLanguage])
    async getLanguagesListFromTmdb(): Promise<TmdbLanguage[]> {
        return await this.languageService.getLanguagesListFromTmdb()
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async createLanguage(
        @Args('data') input: CreateLanguageInput,
    ): Promise<boolean> {
        return await this.languageService.create(input)
    }
}
