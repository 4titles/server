import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbRolePermission,
    permissions,
    rolePermissions,
    roles,
    userRoles,
} from '@/modules/infrastructure/drizzle/schema/roles-permissions.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { AssignPermissionToRoleInput } from './inputs/assign-permission-to-role.input'
import { AssignRoleInput } from './inputs/assign-role.input'
import { CreatePermissionInput } from './inputs/create-permission.input'
import { CreateRoleInput } from './inputs/create-role.input'
import { RemovePermissionFromRoleInput } from './inputs/remove-permission-from-role.input'
import { UnassignRoleInput } from './inputs/unassign-role.input'
import { Permission } from './models/permission.model'
import { Role } from './models/role.model'

@Injectable()
export class RbacService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async createRole(input: CreateRoleInput): Promise<Role> {
        const [result] = await this.db.insert(roles).values(input).returning()

        return result
    }

    async createPermission(input: CreatePermissionInput): Promise<Permission> {
        const [result] = await this.db
            .insert(permissions)
            .values(input)
            .returning()

        return result
    }

    async assignPermissionToRole(
        input: AssignPermissionToRoleInput,
    ): Promise<boolean> {
        const { roleId, permissionId } = input

        const [result] = await this.db
            .insert(rolePermissions)
            .values({ roleId, permissionId })
            .returning()

        return !!result
    }

    async removePermissionFromRole(
        input: RemovePermissionFromRoleInput,
    ): Promise<boolean> {
        const { roleId, permissionId } = input

        const [result] = await this.db
            .delete(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.roleId, roleId),
                    eq(rolePermissions.permissionId, permissionId),
                ),
            )
            .returning()

        return !!result
    }

    async assignRole(input: AssignRoleInput): Promise<boolean> {
        const { userId, roleId } = input

        const roleExists = await this.db.query.roles.findFirst({
            where: eq(roles.id, roleId),
        })

        if (!roleExists) {
            throw new NotFoundException(`Role with ID ${roleId} not found`)
        }

        const newUserRole = {
            userId,
            roleId,
        }

        const [result] = await this.db
            .insert(userRoles)
            .values(newUserRole)
            .returning()

        return !!result
    }

    async unassignRole(input: UnassignRoleInput): Promise<boolean> {
        const { userId, roleId } = input

        const [result] = await this.db
            .delete(userRoles)
            .where(
                and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)),
            )
            .returning()

        return !!result
    }

    async getUserRoles(userId: string): Promise<Role[]> {
        const userRolesResult = await this.db.query.userRoles.findMany({
            where: eq(userRoles.userId, userId),
            with: {
                role: true,
            },
        })

        return userRolesResult.map((ur) => ur.role)
    }

    async getRolePermissions(roleId: string): Promise<Permission[]> {
        const rolePermissionsResult =
            await this.db.query.rolePermissions.findMany({
                where: eq(rolePermissions.roleId, roleId),
                with: {
                    permission: true,
                },
            })

        return rolePermissionsResult.map((rp) => rp.permission)
    }

    async getAllRoles(): Promise<Role[]> {
        return await this.db.query.roles.findMany({
            with: { rolePermissions: true },
        })
    }

    async getAllPermissions(): Promise<Permission[]> {
        return await this.db.query.permissions.findMany({
            with: { rolePermissions: true },
        })
    }

    async getRoleById(id: string): Promise<Role | null> {
        return this.db.query.roles.findFirst({
            where: eq(roles.id, id),
            with: {
                rolePermissions: {
                    with: {
                        permission: true,
                    },
                },
            },
        })
    }

    async getRoleByName(name: string): Promise<Role | null> {
        return await this.db.query.roles.findFirst({
            where: eq(roles.name, name),
        })
    }

    async getRolePermissionsByIdAndPermissionId(
        roleId: string,
        permissionId: string,
    ): Promise<DbRolePermission | null> {
        return await this.db.query.rolePermissions.findFirst({
            where: and(
                eq(rolePermissions.roleId, roleId),
                eq(rolePermissions.permissionId, permissionId),
            ),
        })
    }

    async getPermissionByResourceAndAction(
        resource: string,
        action: string,
    ): Promise<Permission | null> {
        return await this.db.query.permissions.findFirst({
            where: and(
                eq(permissions.resource, resource),
                eq(permissions.action, action),
            ),
        })
    }
}
