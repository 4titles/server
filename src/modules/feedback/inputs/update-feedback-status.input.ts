import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { FeedbackStatus } from '../enums/feedback-status.enum'

@InputType()
export class UpdateFeedbackStatusInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    id: string

    @Field(() => FeedbackStatus)
    @IsEnum(FeedbackStatus)
    status: FeedbackStatus

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    responseMessage?: string
}
