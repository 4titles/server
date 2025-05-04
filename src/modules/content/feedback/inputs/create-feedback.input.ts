import { Field, InputType } from '@nestjs/graphql'
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator'
import { FeedbackType } from '../enums/feedback-type.enum'

@InputType()
export class CreateFeedbackInput {
    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @MaxLength(2500)
    message: string

    @Field(() => FeedbackType, { defaultValue: FeedbackType.GENERAL })
    @IsEnum(FeedbackType)
    @IsOptional()
    type?: FeedbackType

    @Field(() => Number, { nullable: true })
    @IsInt()
    @Min(1)
    @Max(5)
    @IsOptional()
    rating?: number
}
