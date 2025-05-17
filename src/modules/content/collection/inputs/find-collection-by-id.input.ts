import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsUUID } from 'class-validator'

@InputType()
export class FindCollectionByIdInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    id: string
}
