import { InputType } from '@nestjs/graphql'
import { AssignPermissionToRoleInput } from './assign-permission-to-role.input'

@InputType()
export class RemovePermissionFromRoleInput extends AssignPermissionToRoleInput {}
