import { Field, InputType } from '@nestjs/graphql'
import { IsOptional, IsString, Max } from 'class-validator'

@InputType()
export class UpdateCountryInput {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Max(20)
    name?: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Max(20)
    englishName: string
}
