import { registerEnumType } from '@nestjs/graphql'

export enum CommentSortOption {
    LIKES_DESC = 'LIKES_DESC',
    LIKES_ASC = 'LIKES_ASC',
    DATE_DESC = 'DATE_DESC',
    DATE_ASC = 'DATE_ASC',
    REPLIES_DESC = 'REPLIES_DESC',
    REPLIES_ASC = 'REPLIES_ASC',
}

registerEnumType(CommentSortOption, {
    name: 'CommentSortOption',
})
