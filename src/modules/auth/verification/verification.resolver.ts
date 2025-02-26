import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { AuthModel } from '../account/models/auth.model'
import { VerificationInput } from './inputs/verification.input'
import { VerificationService } from './verification.service'

@Resolver()
export class VerificationResolver {
    constructor(private readonly verificationService: VerificationService) {}

    @Mutation(() => AuthModel, {
        description: 'Verify user account with provided token',
    })
    async verify(
        @Context() { req }: GqlContext,
        @Args('data') input: VerificationInput,
        @UserAgent() userAgent: string,
    ): Promise<AuthModel> {
        return await this.verificationService.verify(req, input, userAgent)
    }
}
