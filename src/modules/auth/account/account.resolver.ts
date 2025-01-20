import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AccountService } from './account.service'
import { CreateUserInput } from './inputs/create-user.input'
import { User } from './models/user.model'

@Resolver(() => User)
export class AccountResolver {
    constructor(private readonly accountService: AccountService) {}

    @Authorization()
    @Query(() => User)
    async user(@Authorized('id') id: string): Promise<User> {
        return await this.accountService.findById(id)
    }

    @Mutation(() => Boolean)
    async createAccount(
        @Args('input') input: CreateUserInput,
    ): Promise<boolean> {
        return await this.accountService.create(input)
    }
}
