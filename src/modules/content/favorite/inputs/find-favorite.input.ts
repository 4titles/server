import { InputType } from '@nestjs/graphql'
import { BaseFavoritesInput } from './favorites-input'

@InputType()
export class FindFavoriteInput extends BaseFavoritesInput {}
