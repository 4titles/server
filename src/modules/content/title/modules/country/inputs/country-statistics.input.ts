import { Field, InputType, Int } from '@nestjs/graphql'
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator'

@InputType()
export class CountryStatisticsInput {
    @IsInt()
    @Min(1)
    @IsOptional()
    @Field(() => Int, {
        nullable: true,
        defaultValue: 20,
    })
    limit?: number

    @IsBoolean()
    @IsOptional()
    @Field(() => Boolean, {
        nullable: true,
        defaultValue: true,
    })
    withFilmingLocationsOnly?: boolean
}
