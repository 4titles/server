import { TitleCategory } from '../enums/title-category.enum'
import { TitleSyncSource } from '../enums/title-sync-source.enum'
import { TitleType } from '../enums/title-type.enum'

export interface CategorySyncJobData {
    category: TitleCategory
    page: number
}

export interface TitleSyncJobData {
    tmdbId: string
    type: TitleType
    category: TitleCategory
    source: TitleSyncSource
}

export interface LocationSyncJobData {
    titleId: string
    imdbId: string
    category: TitleCategory
}

export interface LocationDescriptionJobData {
    titleId: string
    locationId: string
    language?: string
}

export type SyncJobData = CategorySyncJobData | TitleSyncJobData
