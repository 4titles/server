import { InputType } from '@nestjs/graphql'
import { BaseFavoritesInput } from './base-favorites-input'

@InputType()
export class FindFavoriteInput extends BaseFavoritesInput {}
