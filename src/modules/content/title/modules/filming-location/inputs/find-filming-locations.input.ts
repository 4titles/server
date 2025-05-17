import { Field, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

@InputType()
export class FindFilmingLocationsInput {
    @Field(() => Int, { defaultValue: 10, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number

    @Field(() => Int, { defaultValue: 0, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    skip?: number

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    search?: string
}
