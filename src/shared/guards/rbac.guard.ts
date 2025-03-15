import { RbacService } from '@/modules/auth/rbac/rbac.service'
import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { InjectRolesBuilder, RolesBuilder } from 'nest-access-control'
import {
    RBAC_METADATA_KEY,
    RequiredPermission,
} from '../decorators/rbac.decorator'

@Injectable()
export class RbacGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectRolesBuilder() private readonly rolesBuilder: RolesBuilder,
        private readonly rbacService: RbacService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.get<RequiredPermission[]>(
            RBAC_METADATA_KEY,
            context.getHandler(),
        )

        if (!requiredPermissions) return true

        const ctx = GqlExecutionContext.create(context)
        const request = ctx.getContext().req
        const userId: string | undefined = request.session.get('userId')

        if (typeof userId === 'undefined') {
            throw new UnauthorizedException()
        }

        const userRoles = await this.rbacService.getUserRoles(userId)

        if (!userRoles || userRoles.length === 0) {
            return false
        }

        return requiredPermissions.every((permission) => {
            const { resource, action, possession } = permission
            const methodName =
                action +
                possession.charAt(0).toUpperCase() +
                possession.slice(1)
            return userRoles.some((role) => {
                const permissionCheck = this.rolesBuilder
                    .can(role.name)
                    [methodName](resource)
                return permissionCheck.granted
            })
        })
    }
}
