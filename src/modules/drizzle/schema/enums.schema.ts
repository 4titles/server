import { MovieStatus } from '@/modules/titles/enums/movie-status.enum'
import { TitleCategory } from '@/modules/titles/enums/title-category.enum'
import { MovieLanguageType } from '@/modules/titles/enums/movie-language-type.enum'
import { SeriesLanguageType } from '@/modules/titles/enums/series-language-type.enum'
import { pgEnum } from 'drizzle-orm/pg-core'

export const titleCategoryEnum = pgEnum('title_category', [
    TitleCategory.POPULAR,
    TitleCategory.TOP_RATED,
    TitleCategory.TRENDING,
    TitleCategory.SEARCH,
    TitleCategory.UPCOMING,
    TitleCategory.AIRING,
] as const)

export const movieStatusEnum = pgEnum('movie_status', [
    MovieStatus.RUMORED,
    MovieStatus.PLANNED,
    MovieStatus.IN_PRODUCTION,
    MovieStatus.POST_PRODUCTION,
    MovieStatus.RELEASED,
    MovieStatus.CANCELED,
] as const)

export const movieLanguageTypeEnum = pgEnum('movie_language_type', [
    MovieLanguageType.ORIGINAL,
    MovieLanguageType.SPOKEN,
])

export const seriesLanguageTypeEnum = pgEnum('series_language_type', [
    SeriesLanguageType.ORIGINAL,
    SeriesLanguageType.SPOKEN,
    SeriesLanguageType.AVAILABLE,
])
