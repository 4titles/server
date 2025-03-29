import { TmdbTitleExtendedResponse } from '../../tmdb/types/tmdb.interface'

export interface TitleDocumentES {
    titleId: string
    details: TmdbTitleExtendedResponse
    createdAt?: number
    updatedAt?: number
}
