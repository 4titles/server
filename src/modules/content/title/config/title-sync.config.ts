import { CronExpression } from '@nestjs/schedule'
import { TitleCategory } from '../enums/title-category.enum'

export interface TitleSyncConfig {
    limits: Record<TitleCategory, number>
    recommendationsLimit: number
    similarLimit: number
    changesCheckIntervalInHours: number
    categorySyncIntervalInHours: number
    cronExpressions: Record<TitleCategory, string>
}

export const DEFAULT_TITLES_FETCH_LIMIT = 100

export const defaultTitleSyncConfig: TitleSyncConfig = {
    limits: {
        [TitleCategory.POPULAR]: DEFAULT_TITLES_FETCH_LIMIT,
        [TitleCategory.TOP_RATED]: DEFAULT_TITLES_FETCH_LIMIT,
        [TitleCategory.TRENDING]: DEFAULT_TITLES_FETCH_LIMIT,
        [TitleCategory.UPCOMING]: DEFAULT_TITLES_FETCH_LIMIT,
        [TitleCategory.AIRING]: DEFAULT_TITLES_FETCH_LIMIT,
        [TitleCategory.REGULAR]: 0,
    },
    recommendationsLimit: 5,
    similarLimit: 5,
    changesCheckIntervalInHours: 24,
    categorySyncIntervalInHours: 6,
    cronExpressions: {
        [TitleCategory.POPULAR]: CronExpression.EVERY_6_HOURS,
        [TitleCategory.TOP_RATED]: CronExpression.EVERY_8_HOURS,
        [TitleCategory.TRENDING]: CronExpression.EVERY_4_HOURS,
        [TitleCategory.UPCOMING]: CronExpression.EVERY_12_HOURS,
        [TitleCategory.AIRING]: CronExpression.EVERY_6_HOURS,
        [TitleCategory.REGULAR]: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    },
}
