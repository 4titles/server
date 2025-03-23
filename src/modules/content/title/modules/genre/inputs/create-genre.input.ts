import { Field, InputType } from '@nestjs/graphql'
import {
    IsDefined,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator'

@InputType()
export class GenreNamesInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    en?: string

    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    ru: string
}

@InputType()
export class CreateGenreInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    tmdbId: string

    @Field(() => GenreNamesInput)
    @IsDefined()
    @IsObject()
    @ValidateNested()
    names: GenreNamesInput
}
