import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { Name } from 'src/entities'
import { NamesService } from '../services/names.service'
import { NameList } from 'src/graphql'

@Resolver(() => Name)
export class NamesResolver {
    constructor(private readonly namesService: NamesService) {}

    @Query(() => Name, { nullable: true })
    async nameById(@Args('id') id: number): Promise<Name | null> {
        return this.namesService.getById(id)
    }

    @Query(() => Name, { nullable: true })
    async nameByImdbId(@Args('imdbId') imdbId: string): Promise<Name | null> {
        return this.namesService.getByImdbId(imdbId)
    }

    @Query(() => [Name])
    async namesByImdbIds(@Args('imdbIds') imdbIds: string[]): Promise<Name[]> {
        return this.namesService.getByImdbIds(imdbIds)
    }

    @Query(() => NameList)
    async names(
        @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
        @Args('take', { type: () => Int, defaultValue: 50 }) take: number,
    ): Promise<{ items: Name[]; totalCount: number }> {
        return this.namesService.getNames(skip, take)
    }
}
