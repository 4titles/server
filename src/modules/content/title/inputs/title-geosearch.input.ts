import { Field, Float, InputType } from '@nestjs/graphql'
import {
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator'
import { TitleSearchOptionsInput } from './title-search-options.input'

@InputType()
export class TitleGeosearchInput {
    @Field(() => Float)
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number

    @Field(() => Float)
    @IsNumber()
    @Min(-180)
    @Max(180)
    lon: number

    @Field(() => String)
    @IsString()
    @Matches(/^\d+(\.\d+)?(km|m|mi|ft|yd)$/)
    distance: string

    @Field(() => TitleSearchOptionsInput, { nullable: true })
    @IsOptional()
    @ValidateNested()
    options: TitleSearchOptionsInput = new TitleSearchOptionsInput()
}
