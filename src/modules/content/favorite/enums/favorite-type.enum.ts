import { registerEnumType } from '@nestjs/graphql'

export enum FavoriteType {
    TITLE = 'TITLE',
    LOCATION = 'LOCATION',
}

registerEnumType(FavoriteType, {
    name: 'FavoriteType',
    description: 'Type of the favorited entity',
})
