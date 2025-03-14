import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Role } from '@/modules/auth/rbac/enums/roles.enum'
import { RbacService } from '@/modules/auth/rbac/rbac.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class RolesPermissionsSeeder {
    constructor(private readonly rbacService: RbacService) {}

    async seed(): Promise<void> {
        await this.seedRoles()
        await this.seedPermissions()
        await this.assignPermissionsToRoles()
    }

    async seedRoles(): Promise<void> {
        const rolesData = [
            { name: Role.USER, description: 'Regular user' },
            { name: Role.MODERATOR, description: 'Moderator' },
            { name: Role.ADMIN, description: 'System administrator' },
        ]

        for (const role of rolesData) {
            const existing = await this.rbacService.getRoleByName(role.name)

            if (!existing) {
                await this.rbacService.createRole(role)
            }
        }
    }

    async seedPermissions(): Promise<void> {
        const permissionsData = [
            // Feedback
            {
                resource: Resource.FEEDBACK,
                action: Action.CREATE,
                description: 'Feedback creation',
            },
            {
                resource: Resource.FEEDBACK,
                action: Action.READ,
                description: 'Feedback reading',
            },
            {
                resource: Resource.FEEDBACK,
                action: Action.UPDATE,
                description: 'Feedback update',
            },
            {
                resource: Resource.FEEDBACK,
                action: Action.DELETE,
                description: 'Feedback deletion',
            },
            // User
            {
                resource: Resource.USER,
                action: Action.CREATE,
                description: 'User creation',
            },
            {
                resource: Resource.USER,
                action: Action.READ,
                description: 'User reading',
            },
            {
                resource: Resource.USER,
                action: Action.UPDATE,
                description: 'User update',
            },
            {
                resource: Resource.USER,
                action: Action.DELETE,
                description: 'User deletion',
            },
            // Notification
            {
                resource: Resource.NOTIFICATION,
                action: Action.CREATE,
                description: 'Notification creation',
            },
            {
                resource: Resource.NOTIFICATION,
                action: Action.READ,
                description: 'Notification reading',
            },
            {
                resource: Resource.NOTIFICATION,
                action: Action.UPDATE,
                description: 'Notification update',
            },
            {
                resource: Resource.NOTIFICATION,
                action: Action.DELETE,
                description: 'Notification deletion',
            },
            // Content
            {
                resource: Resource.CONTENT,
                action: Action.CREATE,
                description: 'Content creation',
            },
            {
                resource: Resource.CONTENT,
                action: Action.READ,
                description: 'Content reading',
            },
            {
                resource: Resource.CONTENT,
                action: Action.UPDATE,
                description: 'Content update',
            },
            {
                resource: Resource.CONTENT,
                action: Action.DELETE,
                description: 'Content deletion',
            },
            // Permission
            {
                resource: Resource.PERMISSION,
                action: Action.CREATE,
                description: 'Permission creation',
            },
            {
                resource: Resource.PERMISSION,
                action: Action.READ,
                description: 'Permission reading',
            },
            {
                resource: Resource.PERMISSION,
                action: Action.UPDATE,
                description: 'Permission update',
            },
            {
                resource: Resource.PERMISSION,
                action: Action.DELETE,
                description: 'Permission deletion',
            },
        ]

        for (const permission of permissionsData) {
            const { resource, action } = permission
            const exists =
                await this.rbacService.getPermissionByResourceAndAction(
                    resource,
                    action,
                )
            if (!exists) {
                await this.rbacService.createPermission(permission)
            }
        }
    }

    async assignPermissionsToRoles(): Promise<void> {
        const adminRole = await this.rbacService.getRoleByName(Role.ADMIN)
        const moderatorRole = await this.rbacService.getRoleByName(
            Role.MODERATOR,
        )
        const userRole = await this.rbacService.getRoleByName(Role.USER)

        if (!adminRole || !moderatorRole || !userRole) {
            throw new Error('Roles not found')
        }

        const allPermissions = await this.rbacService.getAllPermissions()

        for (const perm of allPermissions) {
            const exists =
                await this.rbacService.getRolePermissionsByIdAndPermissionId(
                    adminRole.id,
                    perm.id,
                )
            if (!exists) {
                await this.rbacService.assignPermissionToRole({
                    roleId: adminRole.id,
                    permissionId: perm.id,
                })
            }
        }

        const moderatorAssignments = allPermissions.filter(
            (p) =>
                (p.resource === Resource.FEEDBACK ||
                    p.resource === Resource.CONTENT) &&
                (p.action === Action.READ || p.action === Action.UPDATE),
        )
        for (const perm of moderatorAssignments) {
            const exists =
                await this.rbacService.getRolePermissionsByIdAndPermissionId(
                    moderatorRole.id,
                    perm.id,
                )
            if (!exists) {
                await this.rbacService.assignPermissionToRole({
                    roleId: moderatorRole.id,
                    permissionId: perm.id,
                })
            }
        }

        const userAssignments = allPermissions.filter(
            (p) =>
                (p.resource === Resource.FEEDBACK &&
                    p.action === Action.CREATE) ||
                (p.resource === Resource.FEEDBACK &&
                    p.action === Action.READ) ||
                (p.resource === Resource.NOTIFICATION &&
                    p.action === Action.READ) ||
                (p.resource === Resource.CONTENT && p.action === Action.READ),
        )
        for (const perm of userAssignments) {
            const exists =
                await this.rbacService.getRolePermissionsByIdAndPermissionId(
                    userRole.id,
                    perm.id,
                )
            if (!exists) {
                await this.rbacService.assignPermissionToRole({
                    roleId: userRole.id,
                    permissionId: perm.id,
                })
            }
        }
    }
}
