import { registerEnumType } from '@nestjs/graphql'

export enum CollectionSortType {
    MOST_POPULAR_YEAR = 'MOST_POPULAR_YEAR',
    MOST_POPULAR_SEASON = 'MOST_POPULAR_SEASON',
    MOST_POPULAR_WEEK = 'MOST_POPULAR_WEEK',
    RECENTLY_ADDED = 'RECENTLY_ADDED',
    TOP_RATED = 'TOP_RATED',
    RANDOM = 'RANDOM',
}

registerEnumType(CollectionSortType, {
    name: 'CollectionSortType',
})
