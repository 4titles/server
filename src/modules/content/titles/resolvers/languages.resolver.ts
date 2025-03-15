import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { Language } from '../models/language.model'
import { LanguageService } from '../services'

@Resolver(() => Language)
export class LanguagesResolver {
    constructor(private readonly languageService: LanguageService) {}

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Language], {
        description: 'Get a list of all languages',
    })
    async languages(): Promise<Language[]> {
        return await this.languageService.getAll()
    }

    @RbacProtected({
        resource: Resource.LANGUAGE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Language, {
        nullable: true,
        description: 'Get a language by ISO code',
    })
    async language(
        @Args('iso', { type: () => String }) iso: string,
    ): Promise<Language> {
        return await this.languageService.getLanguageByIso(iso)
    }
}
