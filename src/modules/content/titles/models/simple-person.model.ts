import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class SimplePerson {
    @Field(() => Number, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    credit_id?: string

    @Field(() => String, { nullable: true })
    name?: string

    @Field(() => Number, { nullable: true })
    gender?: number

    @Field(() => String, { nullable: true })
    profile_path?: string
}
