import { registerEnumType } from '@nestjs/graphql'

export enum CollectionType {
    TITLE = 'TITLE',
    LOCATION = 'LOCATION',
}

registerEnumType(CollectionType, {
    name: 'CollectionType',
})
