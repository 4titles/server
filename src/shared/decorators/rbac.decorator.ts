import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { SetMetadata } from '@nestjs/common'

export type Possession = 'own' | 'any'

export interface RequiredPermission {
    resource: Resource
    action: Action
    possession: Possession
}

export const RBAC_METADATA_KEY = 'rbac_permissions'

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
    SetMetadata(RBAC_METADATA_KEY, permissions)
