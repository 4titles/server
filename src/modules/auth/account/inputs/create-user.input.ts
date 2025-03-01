import { IsCustomStrongPassword } from '@/shared/decorators/is-custom-strong-password.decorator'
import { Field, InputType } from '@nestjs/graphql'
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MinLength,
} from 'class-validator'

@InputType()
export class CreateUserInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/)
    username: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string

    @Field(() => String)
    @IsString()
    @IsCustomStrongPassword()
    password: string
}
