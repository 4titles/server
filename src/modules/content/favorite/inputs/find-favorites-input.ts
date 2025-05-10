import { Field, InputType, Int } from '@nestjs/graphql'
import { IsEnum, IsInt, IsOptional } from 'class-validator'
import { FavoriteType } from '../enums/favorite-type.enum'

@InputType()
export class FindFavoritesInput {
    @Field(() => FavoriteType, { nullable: true })
    @IsOptional()
    @IsEnum(FavoriteType)
    type?: FavoriteType

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    take?: number

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    skip?: number
}
