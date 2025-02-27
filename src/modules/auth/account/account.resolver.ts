import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AccountService } from './account.service'
import { ChangeEmailInput } from './inputs/change-email.input'
import { ChangePasswordInput } from './inputs/change-password.input'
import { CreateUserInput } from './inputs/create-user.input'
import { User } from './models/user.model'

@Resolver(() => User)
export class AccountResolver {
    constructor(private readonly accountService: AccountService) {}

    @Authorization()
    @Query(() => User)
    async me(@Authorized('id') id: string): Promise<User> {
        return await this.accountService.findById(id)
    }

    @Mutation(() => Boolean)
    async createAccount(
        @Args('data') input: CreateUserInput,
    ): Promise<boolean> {
        return await this.accountService.create(input)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async changeEmail(
        @Authorized() user: User,
        @Args('data') input: ChangeEmailInput,
    ): Promise<boolean> {
        return await this.accountService.changeEmail(user, input)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async changePassword(
        @Authorized() user: User,
        @Args('data') input: ChangePasswordInput,
    ): Promise<boolean> {
        return await this.accountService.changePassword(user, input)
    }
}
