import { MovieLanguageType } from '../enums/movie-language-type.enum'
import { SeriesLanguageType } from '../enums/series-language-type.enum'

export type MovieLanguageWithRelations = {
    id: number
    iso: string
    englishName: string
    name: string | null
    movies: {
        type: MovieLanguageType
    }[]
}

export type SeriesLanguageWithRelations = {
    id: number
    iso: string
    englishName: string
    name: string | null
    series: {
        type: SeriesLanguageType
    }[]
}
