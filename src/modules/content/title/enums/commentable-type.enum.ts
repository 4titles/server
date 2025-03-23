import { registerEnumType } from '@nestjs/graphql'

// TODO: relocate to comment resource
export enum CommentableType {
    TITLE = 'title',
    LOCATION = 'location',
}

registerEnumType(CommentableType, {
    name: 'CommentableType',
})
