import { registerEnumType } from '@nestjs/graphql'

export enum CommentableType {
    TITLE = 'title',
    LOCATION = 'location',
}

registerEnumType(CommentableType, {
    name: 'CommentableType',
})
