import { MovieLanguageType } from '../../enums/movie-language-type.enum'
import { SeriesLanguageType } from '../../enums/series-language-type.enum'
import { LanguageGroupConfig } from '../../types/language.type'

export const LANGUAGE_TYPE_MAPPING: LanguageGroupConfig = {
    MOVIES: {
        original: MovieLanguageType.ORIGINAL,
        spoken: MovieLanguageType.SPOKEN,
    },
    TV_SHOWS: {
        original: SeriesLanguageType.ORIGINAL,
        spoken: SeriesLanguageType.SPOKEN,
        available: SeriesLanguageType.AVAILABLE,
    },
} as const
