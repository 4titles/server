import { RolesBuilder } from 'nest-access-control'
import { Resource } from './enums/resources.enum'
import { Role } from './enums/roles.enum'

export const RBAC_POLICY: RolesBuilder = new RolesBuilder()

RBAC_POLICY.grant(Role.USER)
    .createOwn(Resource.FEEDBACK)
    .readOwn(Resource.FEEDBACK)
    .updateOwn(Resource.USER)
    .readOwn(Resource.NOTIFICATION)
    .readOwn(Resource.CONTENT)

    .grant(Role.MODERATOR)
    .extend(Role.USER)
    .readAny(Resource.FEEDBACK)
    .updateAny(Resource.FEEDBACK)
    .readAny(Resource.CONTENT)
    .updateAny(Resource.CONTENT)

    .grant(Role.ADMIN)
    .extend(Role.MODERATOR)
    .createAny(Resource.USER)
    .readAny(Resource.USER)
    .updateAny(Resource.USER)
    .deleteAny(Resource.USER)
    .createAny(Resource.FEEDBACK)
    .deleteAny(Resource.FEEDBACK)
    .createAny(Resource.NOTIFICATION)
    .updateAny(Resource.NOTIFICATION)
    .deleteAny(Resource.NOTIFICATION)
    .createAny(Resource.CONTENT)
    .deleteAny(Resource.CONTENT)
    .createAny(Resource.PERMISSION)
    .readAny(Resource.PERMISSION)
    .updateAny(Resource.PERMISSION)
    .deleteAny(Resource.PERMISSION)
