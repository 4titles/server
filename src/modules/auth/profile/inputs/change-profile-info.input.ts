import { Field, InputType } from '@nestjs/graphql'
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator'

@InputType()
export class ChangeProfileInfoInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    @Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/)
    username: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    displayName: string

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    @MaxLength(300)
    bio?: string
}
