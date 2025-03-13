import { ShowResponse, MovieResponse } from 'moviedb-promise'
import { TitleCategory } from '../enums/title-category.enum'

export interface TitleMappingContext {
    category: TitleCategory
    includeRelations?: boolean
}

export interface MovieMappingContext extends TitleMappingContext {
    movieResponse: MovieResponse
}

export interface TvShowMappingContext extends TitleMappingContext {
    showResponse: ShowResponse & { imdb_id: string }
}
