import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, Max } from 'class-validator'

@InputType()
export class CreateCountryInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @Max(2)
    iso: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Max(20)
    name?: string

    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @Max(20)
    englishName: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    flagUrl?: string
}
