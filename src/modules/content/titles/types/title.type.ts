import {
    DbMovie,
    movies,
} from '@/modules/infrastructure/drizzle/schema/movies.schema'
import {
    DbSeries,
    series,
} from '@/modules/infrastructure/drizzle/schema/series.schema'
import { MovieResponse, ShowResponse } from 'moviedb-promise'
import { TitleType } from '../enums/title-type.enum'
import { Movie } from '../models/movie.model'
import { TvShow } from '../models/tv-show.model'

export type Title = Movie | TvShow
export type DbTitle = DbMovie | DbSeries
export type TitleResponse = MovieResponse | ShowResponse
export type DbTitleTable = typeof movies | typeof series

export interface TitleEntityFetchResult {
    type: TitleType
    title: DbTitle
}
