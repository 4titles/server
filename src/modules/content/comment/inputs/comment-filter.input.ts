import { Field, InputType, Int } from '@nestjs/graphql'
import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator'
import { CommentSortOption } from '../enums/comment-sort-option.enum'
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

    @Field(() => CommentSortOption, {
        nullable: true,
        defaultValue: CommentSortOption.DATE_DESC,
    })
    @IsOptional()
    @IsEnum(CommentSortOption)
    sortBy?: CommentSortOption = CommentSortOption.DATE_DESC

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    search?: string

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    take?: number = 20

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    skip?: number = 0
}
