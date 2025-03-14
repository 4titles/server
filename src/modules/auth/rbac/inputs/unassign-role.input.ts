import { InputType } from '@nestjs/graphql'
import { AssignRoleInput } from './assign-role.input'

@InputType()
export class UnassignRoleInput extends AssignRoleInput {}
