import { User } from '@/modules/auth/account/models/user.model'
import { Comment } from '../../comment/models/comment.model'
import { Favorite } from '../../favorite/models/favorite.model'
import { LocationCollectionItem } from '../models/location-collection-item.model'
import { TitleCollectionItem } from '../models/title-collection-item.model'

export interface CollectionMetadata {
    itemsCount: number
    favoritesCount: number
    commentsCount: number
    isFavorite: boolean
    coverImageUrl: string | null
    user: User
    favorites: Favorite[]
    comments: Comment[]
    titleItems: TitleCollectionItem[]
    locationItems: LocationCollectionItem[]
}
