import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class QueueStatus {
    @Field(() => Number)
    waiting: number

    @Field(() => Number)
    active: number

    @Field(() => Number)
    completed: number

    @Field(() => Number)
    failed: number

    @Field(() => Number)
    delayed: number
}
