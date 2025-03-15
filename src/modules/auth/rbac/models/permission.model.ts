import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Permission {
    @Field(() => String)
    id: string

    @Field(() => String)
    resource: string

    @Field(() => String)
    action: string

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => Date)
    createdAt: Date
}
