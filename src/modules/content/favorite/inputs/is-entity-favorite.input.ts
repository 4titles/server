import { InputType } from '@nestjs/graphql'
import { BaseFavoritesInput } from './base-favorites-input'

@InputType()
export class IsEntityFavoriteInput extends BaseFavoritesInput {}
