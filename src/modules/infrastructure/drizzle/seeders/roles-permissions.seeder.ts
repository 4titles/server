import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Role } from '@/modules/auth/rbac/enums/roles.enum'
import { RbacService } from '@/modules/auth/rbac/rbac.service'
import { Injectable } from '@nestjs/common'
import { InjectRolesBuilder, RolesBuilder } from 'nest-access-control'

@Injectable()
export class RolesPermissionsSeeder {
    constructor(
        private readonly rbacService: RbacService,
        @InjectRolesBuilder() private readonly rolesBuilder: RolesBuilder,
    ) {}

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
        const permissionsData = []

        const resourceValues = Object.values(Resource)
        const actionValues = Object.values(Action)

        for (const resource of resourceValues) {
            for (const action of actionValues) {
                permissionsData.push({
                    resource,
                    action,
                    description: `${this.formatActionName(action)} ${this.formatResourceName(resource)}`,
                })
            }
        }

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
        const resources = Object.values(Resource)
        const actions = Object.values(Action)

        for (const roleName of Object.values(Role)) {
            const role = await this.rbacService.getRoleByName(roleName)
            if (!role) continue

            for (const resource of resources) {
                const permissionChecker = this.rolesBuilder.can(roleName)
                for (const action of actions) {
                    const methodOwn = `${action}Own`
                    const methodAny = `${action}Any`
                    if (
                        permissionChecker[methodOwn]?.(resource) ||
                        permissionChecker[methodAny]?.(resource)
                    ) {
                        const dbPermission =
                            await this.rbacService.getPermissionByResourceAndAction(
                                resource,
                                action,
                            )
                        if (dbPermission) {
                            const exists =
                                await this.rbacService.getRolePermissionsByIdAndPermissionId(
                                    role.id,
                                    dbPermission.id,
                                )
                            if (!exists) {
                                await this.rbacService.assignPermissionToRole({
                                    roleId: role.id,
                                    permissionId: dbPermission.id,
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    private formatActionName(action: Action): string {
        const actionMap = {
            [Action.CREATE]: 'Create',
            [Action.READ]: 'Read',
            [Action.UPDATE]: 'Update',
            [Action.DELETE]: 'Delete',
        }
        return actionMap[action] || action
    }

    private formatResourceName(resource: Resource): string {
        const resourceMap = {
            [Resource.USER]: 'users',
            [Resource.FEEDBACK]: 'feedbacks',
            [Resource.NOTIFICATION]: 'notifications',
            [Resource.CONTENT]: 'content',
            [Resource.ROLE]: 'roles',
            [Resource.PERMISSION]: 'permissions',
            [Resource.TITLE]: 'titles',
            [Resource.GENRE]: 'genres',
            [Resource.LANGUAGE]: 'languages',
        }
        return resourceMap[resource] || resource
    }
}
