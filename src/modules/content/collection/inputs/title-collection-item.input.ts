import { Field, InputType, Int } from '@nestjs/graphql'
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

@InputType()
export class TitleCollectionItemInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    titleId: string

    @Field(() => Int, { nullable: true })
    @IsOptional()
    position?: number
}
