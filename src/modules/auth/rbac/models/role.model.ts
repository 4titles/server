import { Field, ObjectType } from '@nestjs/graphql'
import { Permission } from './permission.model'

@ObjectType()
export class Role {
    @Field(() => String)
    id: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => [Permission], { nullable: true })
    permissions?: Permission[]
}
