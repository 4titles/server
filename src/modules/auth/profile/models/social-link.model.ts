import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class SocialLink {
    @Field(() => String)
    id: string

    @Field(() => String)
    title: string

    @Field(() => String)
    url: string

    @Field(() => Number)
    position: number

    @Field(() => String)
    userId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
