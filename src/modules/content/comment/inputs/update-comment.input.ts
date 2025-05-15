import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator'

@InputType()
export class UpdateCommentInput {
    @Field(() => String)
    @IsString()
    @IsUUID('4')
    commentId: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @Length(1, 1000)
    message: string
}
