import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { EnableTotpInput } from './inputs/enable-totp.input'
import { TotpModel } from './models/totp.model'
import { TotpService } from './totp.service'

@Resolver(() => TotpModel)
export class TotpResolver {
    constructor(private readonly totpService: TotpService) {}

    @Authorization()
    @Query(() => TotpModel, {
        description: 'Generate TOTP secret',
    })
    async generate(@Authorized() user: User) {
        return await this.totpService.generate(user)
    }

    @Authorization()
    @Mutation(() => Boolean, {
        description: 'Enable TOTP for the user',
    })
    async enable(
        @Authorized() user: User,
        @Args('data') input: EnableTotpInput,
    ): Promise<boolean> {
        return await this.totpService.enable(user, input)
    }

    @Authorization()
    @Mutation(() => Boolean, {
        description: 'Disable TOTP for the user',
    })
    async disable(@Authorized() user: User): Promise<boolean> {
        return await this.totpService.disable(user)
    }
}
