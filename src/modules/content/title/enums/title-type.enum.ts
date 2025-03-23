import { registerEnumType } from '@nestjs/graphql'

export enum TitleType {
    MOVIE = 'movie',
    TV = 'tv',
}

registerEnumType(TitleType, {
    name: 'TitleType',
    description: 'The type of titles to refresh',
})
