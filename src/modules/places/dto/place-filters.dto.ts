import {
    IsOptional,
    IsString,
    IsNumber,
    IsArray,
    Min,
    Max,
    IsEnum,
} from 'class-validator'
import { Transform } from 'class-transformer'
import { Field, InputType, Float } from '@nestjs/graphql'

export enum PlaceCategory {
    CULTURE = 'entertainment.culture',
    PLANETARIUM = 'entertainment.planetarium',
    MUSEUM = 'entertainment.museum',
    CINEMA = 'entertainment.cinema',
    THEATRE = 'entertainment.culture.theatre',
}

@InputType()
export class PlaceFiltersDto {
    @Field(() => [PlaceCategory], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsEnum(PlaceCategory, { each: true })
    categories?: PlaceCategory[]

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    city?: string

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    country?: string

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    radius?: number

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    searchTerm?: string
}
