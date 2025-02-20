import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { LoginInput } from './inputs/login.input'
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

    @Mutation(() => Boolean)
    async logout(@Context() { req }: GqlContext): Promise<boolean> {
        return await this.sessionService.logout(req)
    }
}
