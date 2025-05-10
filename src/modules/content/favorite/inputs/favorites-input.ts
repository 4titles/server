import { Field, InputType } from '@nestjs/graphql'
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator'
import { FavoriteType } from '../enums/favorite-type.enum'

@InputType()
export class BaseFavoritesInput {
    @Field(() => FavoriteType)
    @IsEnum(FavoriteType)
    type: FavoriteType

    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    entityId: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    locationTitleId?: string
}
