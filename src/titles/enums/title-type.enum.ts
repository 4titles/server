import { registerEnumType } from '@nestjs/graphql'

export enum TitleType {
    MOVIES = 'MOVIES',
    TV_SHOWS = 'TV_SHOWS',
    ALL = 'ALL',
}

registerEnumType(TitleType, {
    name: 'TitleType',
    description: 'The type of titles to refresh',
})
