import { Field, InputType, Int } from '@nestjs/graphql'
import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator'
import { CommentableType } from '../enums/commentable-type.enum'

@InputType()
export class CommentFilterInput {
    @Field(() => CommentableType)
    @IsEnum(CommentableType)
    commentableType: CommentableType

    @Field(() => String)
    @IsString()
    @IsUUID('4')
    commentableId: string

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    take?: number = 20

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    skip?: number = 0
}
