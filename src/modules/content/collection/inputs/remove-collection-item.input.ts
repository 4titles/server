import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator'
import { CollectionType } from '../enums/collection-type.enum'

@InputType()
export class RemoveCollectionItemInput {
    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    collectionId: string

    @Field(() => String)
    @IsNotEmpty()
    @IsUUID('4')
    itemId: string

    @Field(() => CollectionType)
    @IsEnum(CollectionType)
    type: CollectionType
}
