import { RolesBuilder } from 'nest-access-control'
import { Resource } from './enums/resources.enum'
import { Role } from './enums/roles.enum'

export const RBAC_POLICY: RolesBuilder = new RolesBuilder()

RBAC_POLICY.grant(Role.USER)
    // Settings
    .readOwn(Resource.USER)
    .readAny(Resource.USER)
    .updateOwn(Resource.USER)
    .deleteOwn(Resource.USER)
    // Feedbacks
    .createOwn(Resource.FEEDBACK)
    .readOwn(Resource.FEEDBACK)
    // Notifications
    .readOwn(Resource.NOTIFICATION)
    .updateOwn(Resource.NOTIFICATION)
    // Titles
    .readAny(Resource.TITLE)
    // Genres
    .readAny(Resource.GENRE)
    // Languages
    .readAny(Resource.LANGUAGE)
    // Content
    .createOwn(Resource.CONTENT)
    .readOwn(Resource.CONTENT)
    .updateOwn(Resource.CONTENT)
    .deleteOwn(Resource.CONTENT)
    .readAny(Resource.CONTENT)

RBAC_POLICY.grant(Role.MODERATOR)
    .extend(Role.USER)
    // Feedbacks
    .readAny(Resource.FEEDBACK)
    .updateAny(Resource.FEEDBACK)
    // Content
    .readAny(Resource.CONTENT)
    .updateAny(Resource.CONTENT)
    // Notifications
    .readAny(Resource.NOTIFICATION)
    .updateAny(Resource.NOTIFICATION)
    // Titles
    .updateAny(Resource.TITLE)
    .deleteAny(Resource.TITLE)
    // Genres
    .createAny(Resource.GENRE)
    .updateAny(Resource.GENRE)
    .deleteAny(Resource.GENRE)
    // Languages
    .createAny(Resource.LANGUAGE)
    .updateAny(Resource.LANGUAGE)
    .deleteAny(Resource.LANGUAGE)

RBAC_POLICY.grant(Role.ADMIN)
    .extend(Role.MODERATOR)
    // Users
    .createAny(Resource.USER)
    .readAny(Resource.USER)
    .updateAny(Resource.USER)
    .deleteAny(Resource.USER)
    // Feedbacks
    .createAny(Resource.FEEDBACK)
    .deleteAny(Resource.FEEDBACK)
    // Nofitications
    .createAny(Resource.NOTIFICATION)
    .deleteAny(Resource.NOTIFICATION)
    // Content
    .createAny(Resource.CONTENT)
    .deleteAny(Resource.CONTENT)
    // Roles
    .createAny(Resource.ROLE)
    .readAny(Resource.ROLE)
    .updateAny(Resource.ROLE)
    .deleteAny(Resource.ROLE)
    // Permissions
    .createAny(Resource.PERMISSION)
    .readAny(Resource.PERMISSION)
    .updateAny(Resource.PERMISSION)
    .deleteAny(Resource.PERMISSION)
    // Titles
    .createAny(Resource.TITLE)
