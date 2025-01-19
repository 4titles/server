import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString } from 'class-validator'

@InputType()
export class LoginInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    login: string

    @Field()
    @IsString()
    @IsNotEmpty()
    password: string
}
