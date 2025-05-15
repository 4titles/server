import { Field, InputType, Int } from '@nestjs/graphql'
import { IsEnum, IsInt, IsOptional } from 'class-validator'
import { FavorableType } from '../enums/favorable-type.enum'

@InputType()
export class FindFavoritesInput {
    @Field(() => FavorableType, { nullable: true })
    @IsOptional()
    @IsEnum(FavorableType)
    favorableType?: FavorableType

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    take?: number

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    skip?: number
}
