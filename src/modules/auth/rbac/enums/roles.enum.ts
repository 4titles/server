import { registerEnumType } from '@nestjs/graphql'

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
}

registerEnumType(Role, {
    name: 'RolesEnum',
})
