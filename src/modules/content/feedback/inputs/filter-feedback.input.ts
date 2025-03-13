import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { FeedbackSource } from '../enums/feedback-source.enum'
import { FeedbackStatus } from '../enums/feedback-status.enum'
import { FeedbackType } from '../enums/feedback-type.enum'

@InputType()
export class FilterFeedbackInput {
    @Field(() => FeedbackType, { nullable: true })
    @IsEnum(FeedbackType)
    @IsOptional()
    type?: FeedbackType

    @Field(() => FeedbackSource, { nullable: true })
    @IsEnum(FeedbackSource)
    @IsOptional()
    source?: FeedbackSource

    @Field(() => FeedbackStatus, { nullable: true })
    @IsEnum(FeedbackStatus)
    @IsOptional()
    status?: FeedbackStatus

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    userId?: string
}
