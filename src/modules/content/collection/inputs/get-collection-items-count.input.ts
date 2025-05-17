import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator'
import { CollectionType } from '../enums/collection-type.enum'

@InputType()
export class GetCollectionItemsCountInput {
    @Field(() => String)
    @IsUUID('4')
    @IsNotEmpty()
    id: string

    @Field(() => CollectionType)
    @IsEnum(CollectionType)
    @IsNotEmpty()
    type: CollectionType
}
