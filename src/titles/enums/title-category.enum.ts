import { registerEnumType } from '@nestjs/graphql'

export enum TitleCategory {
    POPULAR = 'POPULAR',
    TOP_RATED = 'TOP_RATED',
    TRENDING = 'TRENDING',
}

registerEnumType(TitleCategory, {
    name: 'TitleCategory',
    description: 'The category of the title',
})
