import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { Action } from '../rbac/enums/actions.enum'
import { Resource } from '../rbac/enums/resources.enum'
import { EnableTotpInput } from './inputs/enable-totp.input'
import { TotpModel } from './models/totp.model'
import { TotpService } from './totp.service'

@Resolver(() => TotpModel)
export class TotpResolver {
    constructor(private readonly totpService: TotpService) {}

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => TotpModel, {
        description: 'Generate TOTP secret',
    })
    async generate(@Authorized() user: User): Promise<TotpModel> {
        return await this.totpService.generate(user)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean, {
        description: 'Enable TOTP for the user',
    })
    async enable(
        @Authorized() user: User,
        @Args('data') input: EnableTotpInput,
    ): Promise<boolean> {
        return await this.totpService.enable(user, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean, {
        description: 'Disable TOTP for the user',
    })
    async disable(@Authorized() user: User): Promise<boolean> {
        return await this.totpService.disable(user)
    }
}
