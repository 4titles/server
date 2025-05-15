import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

@InputType()
export class DeleteCommentInput {
    @Field(() => String)
    @IsString()
    @IsUUID('4')
    @IsNotEmpty()
    commentId: string
}
