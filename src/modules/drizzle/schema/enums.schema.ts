import { MovieStatus } from '@/modules/titles/enums/movie-status.enum'
import { TitleCategory } from '@/modules/titles/enums/title-category.enum'
import { pgEnum } from 'drizzle-orm/pg-core'

export const titleCategoryEnum = pgEnum('title_category', [
    TitleCategory.POPULAR,
    TitleCategory.TOP_RATED,
    TitleCategory.TRENDING,
    TitleCategory.SEARCH,
    TitleCategory.UPCOMING,
] as const)

export const movieStatusEnum = pgEnum('movie_status', [
    MovieStatus.RUMORED,
    MovieStatus.PLANNED,
    MovieStatus.IN_PRODUCTION,
    MovieStatus.POST_PRODUCTION,
    MovieStatus.RELEASED,
    MovieStatus.CANCELED,
] as const)
