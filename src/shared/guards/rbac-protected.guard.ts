import { applyDecorators, UseGuards } from '@nestjs/common'
import {
    RequiredPermission,
    RequirePermissions,
} from '../decorators/rbac.decorator'
import { GqlAuthGuard } from '../guards/gql-auth.guard'
import { RbacGuard } from './rbac.guard'

export function RbacProtected(...permissions: RequiredPermission[]) {
    return applyDecorators(
        UseGuards(GqlAuthGuard, RbacGuard),
        RequirePermissions(...permissions),
    )
}
