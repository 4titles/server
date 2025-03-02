import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsNumber, IsString, IsUrl, IsUUID } from 'class-validator'

@InputType()
export class SocialLinkInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    title: string

    @Field(() => String)
    @IsUrl()
    @IsNotEmpty()
    url: string
}

@InputType()
export class SocialLinkOrderInput {
    @Field(() => String)
    @IsUUID('4')
    @IsNotEmpty()
    id: string

    @Field(() => Number)
    @IsNumber()
    @IsNotEmpty()
    position: number
}
