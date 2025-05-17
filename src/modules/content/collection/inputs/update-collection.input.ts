import { Field, InputType } from '@nestjs/graphql'
import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator'
import { LocationCollectionItemInput } from './location-collection-item.input'
import { TitleCollectionItemInput } from './title-collection-item.input'

@InputType()
export class UpdateCollectionInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    id: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    description?: string

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean

    @Field(() => [TitleCollectionItemInput], { nullable: true })
    @IsOptional()
    titleItems?: TitleCollectionItemInput[]

    @Field(() => [LocationCollectionItemInput], { nullable: true })
    @IsOptional()
    locationItems?: LocationCollectionItemInput[]
}
