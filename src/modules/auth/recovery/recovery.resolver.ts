import { UserAgent } from '@/shared/decorators/user-agent.decorator'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql'
import { NewPasswordInput } from './input/new-password.input'
import { ResetPasswordInput } from './input/reset-password.input'
import { RecoveryService } from './recovery.service'

@Resolver()
export class RecoveryResolver {
    constructor(private readonly recoveryService: RecoveryService) {}

    @Mutation(() => Boolean)
    async resetPassword(
        @Context() { req }: GqlContext,
        @Args('data') input: ResetPasswordInput,
        @UserAgent() userAgent: string,
    ) {
        return await this.recoveryService.resetPassword(req, input, userAgent)
    }

    @Mutation(() => Boolean)
    async newPassword(@Args('data') input: NewPasswordInput) {
        return await this.recoveryService.setNewPassword(input)
    }
}
