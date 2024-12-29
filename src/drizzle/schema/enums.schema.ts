import { pgEnum } from 'drizzle-orm/pg-core'
import { MovieStatus } from 'src/titles/enums/movie-status.enum'
import { TitleCategory } from 'src/titles/enums/title-category.enum'

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
