import { DbTitle } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import {
    TmdbTitleExtendedResponse,
    TmdbTitleResponse,
} from '../modules/tmdb/types/tmdb.interface'

export interface TitleSyncData {
    title: TmdbTitleResponse
    titleDetails: TmdbTitleExtendedResponse
    type: TitleType
    category: TitleCategory
    imdbId?: string | null
    existingTitle?: DbTitle
}
