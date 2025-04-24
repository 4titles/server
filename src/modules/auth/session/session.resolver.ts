import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthModel } from '../account/models/auth.model'
import { Action } from '../rbac/enums/actions.enum'
import { Resource } from '../rbac/enums/resources.enum'
import { LoginInput } from './inputs/login.input'
import { Session } from './models/session.model'
import { SessionService } from './session.service'

@Resolver(() => Session)
export class SessionResolver {
    constructor(private readonly sessionService: SessionService) {}

    @Mutation(() => AuthModel)
    async login(
        @Context() { req }: GqlContext,
        @Args('data') input: LoginInput,
        @UserAgent() userAgent: string,
    ) {
        return await this.sessionService.login(req, input, userAgent)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async logout(@Context() { req }: GqlContext): Promise<boolean> {
        return await this.sessionService.logout(req)
    }

    @Mutation(() => Boolean)
    async clearSessionCookie(@Context() { req }: GqlContext): Promise<boolean> {
        return await this.sessionService.clearSession(req)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.DELETE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async removeSession(
        @Context() { req }: GqlContext,
        @Args('id') id: string,
    ): Promise<boolean> {
        return await this.sessionService.remove(req, id)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Session], {
        description: 'Get a list of user sessions',
        name: 'findSessionsByUser',
    })
    async findByUser(@Context() { req }: GqlContext) {
        return await this.sessionService.findByUser(req)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => Session, {
        description: 'Get a current user session',
        name: 'findCurrentSession',
    })
    async findCurrent(@Context() { req }: GqlContext) {
        return await this.sessionService.findCurrent(req)
    }
}
