import { Authorization } from '@/shared/decorators/auth.decorator'
import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { LoginInput } from './inputs/login.input'
import { SessionModel } from './models/session.model'
import { SessionService } from './session.service'

@Resolver('Session')
export class SessionResolver {
    constructor(private readonly sessionService: SessionService) {}

    @Mutation(() => User)
    async login(
        @Context() { req }: GqlContext,
        @Args('data') input: LoginInput,
        @UserAgent() userAgent: string,
    ): Promise<User> {
        return await this.sessionService.login(req, input, userAgent)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async logout(@Context() { req }: GqlContext): Promise<boolean> {
        return await this.sessionService.logout(req)
    }

    @Mutation(() => Boolean)
    async clearSessionCookie(@Context() { req }: GqlContext): Promise<boolean> {
        return await this.sessionService.clearSession(req)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async removeSession(
        @Context() { req }: GqlContext,
        @Args('id') id: string,
    ): Promise<boolean> {
        return await this.sessionService.remove(req, id)
    }

    @Authorization()
    @Query(() => [SessionModel], {
        description: 'Get a list of user sessions',
    })
    async findByUser(@Context() { req }: GqlContext) {
        return await this.sessionService.findByUser(req)
    }

    @Authorization()
    @Query(() => SessionModel, {
        description: 'Get a current user session',
    })
    async findCurrent(@Context() { req }: GqlContext) {
        return await this.sessionService.findCurrent(req)
    }
}
