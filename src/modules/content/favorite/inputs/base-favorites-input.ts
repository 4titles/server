import { Field, InputType } from '@nestjs/graphql'
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator'
import { FavorableType } from '../enums/favorable-type.enum'

@InputType()
export class BaseFavoritesInput {
    @Field(() => FavorableType)
    @IsEnum(FavorableType)
    favorableType: FavorableType

    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    favorableId: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @IsUUID('4')
    contextId?: string
}
