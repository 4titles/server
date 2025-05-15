import { Field, InputType } from '@nestjs/graphql'
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Length,
} from 'class-validator'
import { CommentableType } from '../enums/commentable-type.enum'

@InputType()
export class CreateCommentInput {
    @Field(() => CommentableType)
    @IsEnum(CommentableType)
    commentableType: CommentableType

    @Field(() => String)
    @IsUUID()
    @IsNotEmpty()
    commentableId: string

    @Field(() => String, { nullable: true })
    @IsUUID()
    @IsOptional()
    parentId?: string

    @Field(() => String)
    @IsString()
    @IsNotEmpty()
    @Length(1, 1000)
    message: string
}
