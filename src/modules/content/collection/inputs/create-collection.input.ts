import { Field, InputType, Int } from '@nestjs/graphql'
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator'
import { CollectionType } from '../enums/collection-type.enum'
import { LocationCollectionItemInput } from './location-collection-item.input'
import { TitleCollectionItemInput } from './title-collection-item.input'

@InputType()
export class CreateCollectionInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    title: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(300)
    description?: string

    @Field(() => Boolean, { defaultValue: false })
    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean

    @Field(() => CollectionType)
    @IsEnum(CollectionType)
    type: CollectionType

    @Field(() => [TitleCollectionItemInput], { nullable: true })
    @IsOptional()
    titleItems?: TitleCollectionItemInput[]

    @Field(() => [LocationCollectionItemInput], { nullable: true })
    @IsOptional()
    locationItems?: LocationCollectionItemInput[]
}
