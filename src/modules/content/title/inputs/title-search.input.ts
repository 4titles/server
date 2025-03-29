import { Field, InputType } from '@nestjs/graphql'
import {
    IsOptional,
    IsString,
    MinLength,
    ValidateNested,
} from 'class-validator'
import { TitleSearchOptionsInput } from './title-search-options.input'

@InputType()
export class TitleSearchInput {
    @Field(() => String)
    @IsString()
    @MinLength(3)
    query: string

    @Field(() => TitleSearchOptionsInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    options: TitleSearchOptionsInput = new TitleSearchOptionsInput()
}
