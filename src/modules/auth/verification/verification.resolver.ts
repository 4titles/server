import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { VerificationInput } from './inputs/verification.input'
import { VerificationService } from './verification.service'

@Resolver()
export class VerificationResolver {
    constructor(private readonly verificationService: VerificationService) {}

    @Mutation(() => User, {
        description: 'Verify user account with provided token',
    })
    async verify(
        @Context() { req }: GqlContext,
        @Args('data') input: VerificationInput,
        @UserAgent() userAgent: string,
    ): Promise<User> {
        return await this.verificationService.verify(req, input, userAgent)
    }
}
