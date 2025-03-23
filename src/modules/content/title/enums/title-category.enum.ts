import { registerEnumType } from '@nestjs/graphql'

export enum TitleCategory {
    POPULAR = 'popular',
    TOP_RATED = 'top_rated',
    TRENDING = 'trending',
    UPCOMING = 'upcoming',
    AIRING = 'airing',
    REGULAR = 'regular',
}

registerEnumType(TitleCategory, {
    name: 'TitleCategory',
})
