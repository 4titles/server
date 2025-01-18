import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AccountService } from './account.service'
import { User } from './models/user.model'
import { CreateUserInput } from './inputs/create-user.input'

@Resolver(() => User)
export class AccountResolver {
    constructor(private readonly accountService: AccountService) {}

    @Query(() => [User])
    async findAll(): Promise<User[]> {
        return await this.accountService.findAll()
    }

    @Mutation(() => Boolean)
    async createAccount(
        @Args('input') input: CreateUserInput,
    ): Promise<boolean> {
        return await this.accountService.create(input)
    }
}
