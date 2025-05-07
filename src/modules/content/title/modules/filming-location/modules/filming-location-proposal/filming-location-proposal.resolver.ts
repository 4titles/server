import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { FilmingLocationProposalService } from './filming-location-proposal.service'
import { CreateFilmingLocationProposalInput } from './inputs/create-filming-location-proposal.input'
import { UpdateFilmingLocationProposalStatusInput } from './inputs/update-filming-location-proposal-status.input'
import { FilmingLocationProposal } from './models/filming-location-proposal.model'

@Resolver(() => FilmingLocationProposal)
export class FilmingLocationProposalResolver {
    constructor(
        private readonly filmingLocationProposalService: FilmingLocationProposalService,
    ) {}

    @Authorization()
    @Mutation(() => Boolean)
    async createFilmingLocationProposal(
        @Authorized() user: User,
        @Args('input') input: CreateFilmingLocationProposalInput,
    ): Promise<Boolean> {
        return await this.filmingLocationProposalService.createProposal(
            input,
            user,
        )
    }

    @RbacProtected({
        resource: Resource.FILMING_LOCATION,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async updateFilmingLocationProposalStatus(
        @Args('input') input: UpdateFilmingLocationProposalStatusInput,
    ): Promise<Boolean> {
        return await this.filmingLocationProposalService.updateProposalStatus(
            input,
        )
    }

    @Authorization()
    @Query(() => [FilmingLocationProposal])
    async findUserFilmingLocationProposals(@Authorized() user: User) {
        return await this.filmingLocationProposalService.findProposalsByUserId(
            user.id,
        )
    }

    @RbacProtected({
        resource: Resource.FILMING_LOCATION,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => FilmingLocationProposal, { nullable: true })
    async findFilmingLocationProposalById(@Args('id') id: string) {
        return await this.filmingLocationProposalService.findProposalById(id)
    }
}
