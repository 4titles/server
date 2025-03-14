import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsUUID } from 'class-validator'

@InputType()
export class AssignRoleInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID()
    userId: string

    @Field(() => String)
    @IsNotEmpty()
    @IsUUID()
    roleId: string
}
