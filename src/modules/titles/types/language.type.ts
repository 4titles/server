import { DbLanguage } from '@/modules/drizzle/schema/languages.schema'
import { MovieLanguageType } from '../enums/movie-language-type.enum'
import { SeriesLanguageType } from '../enums/series-language-type.enum'
import { TitleType } from '../enums/title-type.enum'
import { Language } from '../models/language.model'

export type LanguageType = Language | DbLanguage
export type TitleLanguageType = MovieLanguageType | SeriesLanguageType

export interface GroupedLanguages {
    original: Language[]
    spoken: Language[]
    available: Language[]
}

export type LanguageGroupConfig = {
    [K in TitleType.MOVIES & TitleType.TV_SHOWS]: {
        original: MovieLanguageType | SeriesLanguageType
        spoken: MovieLanguageType | SeriesLanguageType
        available: SeriesLanguageType
    }
}

export interface TitleLanguage {
    language: LanguageType
    type: TitleLanguageType
}

export interface DbMovieLanguageResult {
    language: DbLanguage
    type: MovieLanguageType
}

export interface DbSeriesLanguageResult {
    language: DbLanguage
    type: SeriesLanguageType
}
