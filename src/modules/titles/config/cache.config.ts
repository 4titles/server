import { TitleType } from 'src/entities/title.entity'

export const CACHE_CONFIG = {
    RAW_TITLES: {
        PREFIX: 'raw_titles',
        TTL: 3600 * 24 * 90, // 3 months
    },
    TITLES: {
        PREFIX: 'titles',
        TTL: 3600 * 24 * 90, // 3 months
    },
} as const

export const getCacheKey = {
    forRawTitles: () => CACHE_CONFIG.RAW_TITLES.PREFIX,

    forTitle: (imdbId: string): string => {
        return `${CACHE_CONFIG.TITLES.PREFIX}_title_${imdbId}`
    },

    forTitles: (imdbIds: string[]): string => {
        return `${CACHE_CONFIG.TITLES.PREFIX}_titles_${imdbIds.sort().join('_')}`
    },

    forTitleType: (type: TitleType): string => {
        return `${CACHE_CONFIG.TITLES.PREFIX}_${type.toLowerCase()}`
    },

    forAllTitleTypes: (): string[] => {
        return Object.values(TitleType).map(
            (type) => `${CACHE_CONFIG.TITLES.PREFIX}_${type.toLowerCase()}`,
        )
    },
} as const

export const CACHE_ERRORS = {
    FAILED_TO_GET: (key: string) => `Failed to get cache for key: ${key}`,
    FAILED_TO_SET: (key: string) => `Failed to set cache for key: ${key}`,
    FAILED_TO_DELETE: (key: string) => `Failed to delete cache for key: ${key}`,
} as const
