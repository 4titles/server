import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class FeedbackStats {
    @Field(() => Number)
    total: number

    @Field(() => Number)
    newCount: number

    @Field(() => Number)
    inProgressCount: number

    @Field(() => Number)
    resolvedCount: number

    @Field(() => Number)
    closedCount: number

    @Field(() => Number)
    rejectedCount: number

    @Field(() => Number)
    bugReportsCount: number

    @Field(() => Number)
    featureRequestsCount: number

    @Field(() => Number)
    averageRating: number
}
