import { Field, InputType, Int } from '@nestjs/graphql'
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator'
import { TitleCategory } from '../enums/title-category.enum'

@InputType()
export class TitleFilterInput {
    @Field(() => TitleCategory, { nullable: true })
    @IsOptional()
    @IsEnum(TitleCategory)
    category?: TitleCategory

    @Field(() => Boolean, { nullable: true })
    @IsOptional()
    @IsBoolean()
    withFilmingLocations?: boolean

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    offset: number = 0
}
