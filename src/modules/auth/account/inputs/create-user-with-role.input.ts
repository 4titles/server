import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty } from 'class-validator'
import { Role } from '../../rbac/enums/roles.enum'
import { CreateUserInput } from './create-user.input'

@InputType()
export class CreateUserWithRoleInput extends CreateUserInput {
    @Field(() => Role, { defaultValue: Role.USER })
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role
}
