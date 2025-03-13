import { Field, ObjectType } from '@nestjs/graphql'
import { Feedback } from './feedback.model'

@ObjectType()
export class FeedbackSubmitResponse {
    @Field(() => Boolean)
    success: boolean

    @Field(() => String, { nullable: true })
    message?: string

    @Field(() => Feedback, { nullable: true })
    feedback?: Feedback
}
