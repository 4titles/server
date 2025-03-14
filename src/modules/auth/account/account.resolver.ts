import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { GqlContext } from '@/shared/types/gql-context.types'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Action } from '../rbac/enums/actions.enum'
import { Resource } from '../rbac/enums/resources.enum'
import { AccountService } from './account.service'
import { ChangeEmailInput } from './inputs/change-email.input'
import { ChangePasswordInput } from './inputs/change-password.input'
import { CreateUserWithRoleInput } from './inputs/create-user-with-role.input'
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

    @RbacProtected({
        resource: Resource.USER,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async createAccountWithRole(
        @Args('data') input: CreateUserWithRoleInput,
    ): Promise<boolean> {
        return await this.accountService.create(input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async changeEmail(
        @Authorized() user: User,
        @Args('data') input: ChangeEmailInput,
    ): Promise<boolean> {
        return await this.accountService.changeEmail(user, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async changePassword(
        @Authorized() user: User,
        @Args('data') input: ChangePasswordInput,
    ): Promise<boolean> {
        return await this.accountService.changePassword(user, input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.DELETE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async deleteAccount(
        @Context() { req }: GqlContext,
        @Args('userId') userId: string,
    ): Promise<boolean> {
        return await this.accountService.delete(req, userId)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [User])
    async findAllUsers(): Promise<User[]> {
        return await this.accountService.findAll()
    }
}
