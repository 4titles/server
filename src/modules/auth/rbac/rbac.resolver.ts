import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../account/models/user.model'
import { Action } from './enums/actions.enum'
import { Resource } from './enums/resources.enum'
import { AssignPermissionToRoleInput } from './inputs/assign-permission-to-role.input'
import { AssignRoleInput } from './inputs/assign-role.input'
import { CreatePermissionInput } from './inputs/create-permission.input'
import { CreateRoleInput } from './inputs/create-role.input'
import { RemovePermissionFromRoleInput } from './inputs/remove-permission-from-role.input'
import { UnassignRoleInput } from './inputs/unassign-role.input'
import { Permission } from './models/permission.model'
import { Role } from './models/role.model'
import { RbacService } from './rbac.service'

@Resolver(() => Role)
export class RbacResolver {
    constructor(private readonly rbacService: RbacService) {}

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Role)
    async createRole(@Args('data') input: CreateRoleInput): Promise<Role> {
        return await this.rbacService.createRole(input)
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Permission)
    async createPermission(
        @Args('data') input: CreatePermissionInput,
    ): Promise<Permission> {
        return await this.rbacService.createPermission(input)
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async assignPermissionToRole(
        @Args('data') input: AssignPermissionToRoleInput,
    ): Promise<boolean> {
        return await this.rbacService.assignPermissionToRole(input)
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async removePermissionFromRole(
        @Args('data') input: RemovePermissionFromRoleInput,
    ): Promise<boolean> {
        return await this.rbacService.removePermissionFromRole(input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async assignRole(@Args('data') input: AssignRoleInput): Promise<boolean> {
        return await this.rbacService.assignRole(input)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async unassignRole(
        @Args('data') input: UnassignRoleInput,
    ): Promise<boolean> {
        return await this.rbacService.unassignRole(input)
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Role])
    async getAllRoles(): Promise<Role[]> {
        return await this.rbacService.getAllRoles()
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Permission])
    async getAllPermissions(): Promise<Permission[]> {
        return await this.rbacService.getAllPermissions()
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Role, { nullable: true })
    async getRoleById(@Args('id') id: string): Promise<Role | null> {
        return await this.rbacService.getRoleById(id)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Role])
    async getUserRoles(
        @Authorized() user: User,
        @Args('userId', { nullable: true }) userId?: string,
    ): Promise<Role[]> {
        if (!userId) {
            return await this.rbacService.getUserRoles(user.id)
        }

        return await this.rbacService.getUserRoles(userId)
    }

    @RbacProtected({
        resource: Resource.PERMISSION,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Permission])
    async getRolePermissions(
        @Args('roleId') roleId: string,
    ): Promise<Permission[]> {
        return await this.rbacService.getRolePermissions(roleId)
    }
}
