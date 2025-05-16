import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { CommentableType } from '../enums/commentable-type.enum'

@InputType()
export class GetCommentCountInput {
    @Field(() => CommentableType)
    @IsEnum(CommentableType)
    commentableType: CommentableType

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    commentableId: string
}
