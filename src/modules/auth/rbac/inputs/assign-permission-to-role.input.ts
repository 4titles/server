import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsUUID } from 'class-validator'

@InputType()
export class AssignPermissionToRoleInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID()
    roleId: string

    @Field(() => String)
    @IsNotEmpty()
    @IsUUID()
    permissionId: string
}
