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

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Language, { name: 'findLanguageById' })
    async findLanguageById(@Args('id') id: string) {
        return this.languageService.findById(id)
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Language, { name: 'findLanguageByISO' })
    async findByISO(@Args('iso') iso: string) {
        return this.languageService.findByISO(iso)
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Language, { name: 'findLanguageByEnglishName' })
    async findByEnglishName(
        @Args('englishName') englishName: string,
    ): Promise<Language> {
        return await this.languageService.findByEnglishName(englishName)
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Language, { name: 'findLanguageByNativeName' })
    async findByNativeName(
        @Args('nativeName') nativeName: string,
    ): Promise<Language> {
        return await this.languageService.findByNativeName(nativeName)
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Language], { name: 'findAllLanguages' })
    async findAll(): Promise<Language[]> {
        return await this.languageService.findAll()
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Language], { name: 'findAllLanguagesWithRelations' })
    async findAllWithRelations() {
        return await this.languageService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TmdbLanguage], { name: 'getLanguagesListFromTmdb' })
    async getListFromTmdb(): Promise<TmdbLanguage[]> {
        return await this.languageService.getLanguagesListFromTmdb()
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean, { name: 'createLanguage' })
    async create(@Args('data') input: CreateLanguageInput): Promise<boolean> {
        return await this.languageService.create(input)
    }
}
