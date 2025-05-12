import { Field, Float, InputType, Int } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsISO8601,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleSortOption } from '../enums/title-sort-option.enum'
import { TitleStatus } from '../enums/title-status.enum'
import { TitleType } from '../enums/title-type.enum'

@InputType()
export class DateRangeInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsISO8601()
    from?: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsISO8601()
    to?: string
}

@InputType()
export class NumberRangeInput {
    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    from?: number

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    to?: number
}

@InputType()
export class TitleFilterInput {
    @Field(() => TitleType, { nullable: true })
    @IsOptional()
    @IsEnum(TitleType)
    type?: TitleType

    @Field(() => TitleCategory, { nullable: true })
    @IsOptional()
    @IsEnum(TitleCategory)
    category?: TitleCategory

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    withFilmingLocations?: boolean

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    searchTerm?: string

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    take?: number

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    skip?: number

    @Field(() => DateRangeInput, { nullable: true })
    @IsOptional()
    @Type(() => DateRangeInput)
    releaseDateRange?: DateRangeInput

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    genreIds?: string[]

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    countryIsos?: string[]

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    name?: string

    @Field(() => NumberRangeInput, { nullable: true })
    @IsOptional()
    @Type(() => NumberRangeInput)
    runtimeRange?: NumberRangeInput

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    originalLanguageIsos?: string[]

    @Field(() => NumberRangeInput, { nullable: true })
    @IsOptional()
    @Type(() => NumberRangeInput)
    voteAverageRange?: NumberRangeInput

    @Field(() => [TitleStatus], { nullable: true })
    @IsOptional()
    @IsEnum(TitleStatus, { each: true })
    statuses?: TitleStatus[]

    @Field(() => TitleSortOption, { nullable: true })
    @IsOptional()
    @IsEnum(TitleSortOption)
    sortBy?: TitleSortOption
}
