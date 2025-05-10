import { InputType } from '@nestjs/graphql'
import { BaseFavoritesInput } from './favorites-input'

@InputType()
export class IsEntityFavoriteInput extends BaseFavoritesInput {}
