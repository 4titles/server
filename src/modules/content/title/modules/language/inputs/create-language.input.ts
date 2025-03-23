import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString, Max } from 'class-validator'

@InputType()
export class CreateLanguageInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @Max(2)
    iso: string

    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @Max(20)
    englishName: string

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @Max(20)
    nativeName?: string
}
