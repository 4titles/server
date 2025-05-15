import { registerEnumType } from '@nestjs/graphql'

export enum CommentableType {
    TITLE = 'TITLE',
    LOCATION = 'LOCATION',
    COLLECTION = 'COLLECTION',
}

registerEnumType(CommentableType, { name: 'CommentableType' })
