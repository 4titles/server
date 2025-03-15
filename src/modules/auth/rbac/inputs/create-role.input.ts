import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

@InputType()
export class CreateRoleInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    name: string

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    description?: string
}
