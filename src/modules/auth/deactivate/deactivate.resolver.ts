import { Authorized } from '@/shared/decorators/authorized.decorator'
import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { AuthModel } from '../account/models/auth.model'
import { User } from '../account/models/user.model'
import { Action } from '../rbac/enums/actions.enum'
import { Resource } from '../rbac/enums/resources.enum'
import { DeactivateService } from './deactivate.service'
import { DeactivateAccountInput } from './inputs/deactivate-account.input'

@Resolver()
export class DeactivateResolver {
    constructor(private readonly deactivateService: DeactivateService) {}

    @RbacProtected({
        resource: Resource.USER,
        action: Action.DELETE,
        possession: 'own',
    })
    @Mutation(() => AuthModel, { description: 'Deactivate an account' })
    async deactivate(
        @Context() { req }: GqlContext,
        @Args('data') input: DeactivateAccountInput,
        @Authorized() user: User,
        @UserAgent() userAgent: string,
    ): Promise<AuthModel> {
        return await this.deactivateService.deactivate(
            req,
            input,
            user,
            userAgent,
        )
    }
}
