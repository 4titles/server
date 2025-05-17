import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsNumber, IsUUID } from 'class-validator'
import { CollectionType } from '../enums/collection-type.enum'

@InputType()
export class CollectionItemOrderInput {
    @Field(() => String)
    @IsUUID('4')
    @IsNotEmpty()
    id: string

    @Field(() => Number)
    @IsNumber()
    @IsNotEmpty()
    position: number

    @Field(() => CollectionType)
    @IsEnum(CollectionType)
    @IsNotEmpty()
    type: CollectionType
}
