import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { FeedbackSource } from '../enums/feedback-source.enum'
import { FeedbackStatus } from '../enums/feedback-status.enum'
import { FeedbackType } from '../enums/feedback-type.enum'

registerEnumType(FeedbackType, {
    name: 'FeedbackType',
    description: 'Type of feedback',
})

registerEnumType(FeedbackSource, {
    name: 'FeedbackSource',
    description: 'Source of feedback',
})

registerEnumType(FeedbackStatus, {
    name: 'FeedbackStatus',
    description: 'Status of feedback',
})

@ObjectType()
export class Feedback {
    @Field(() => String)
    id: string

    @Field(() => String)
    message: string

    @Field(() => FeedbackType)
    type: FeedbackType

    @Field(() => FeedbackSource)
    source: FeedbackSource

    @Field(() => Number, { nullable: true })
    rating?: number

    @Field(() => FeedbackStatus)
    status: FeedbackStatus

    @Field(() => String, { nullable: true })
    responseMessage?: string

    @Field(() => User, { nullable: true })
    user?: User

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date

    @Field(() => Date, { nullable: true })
    respondedAt?: Date
}
