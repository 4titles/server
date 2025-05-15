import { registerEnumType } from '@nestjs/graphql'

export enum FavorableType {
    TITLE = 'TITLE',
    LOCATION = 'LOCATION',
    COLLECTION = 'COLLECTION',
}

registerEnumType(FavorableType, {
    name: 'FavorableType',
    description: 'Type of the favorited entity',
})
