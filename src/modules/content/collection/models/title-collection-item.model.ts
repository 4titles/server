import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Title } from '../../title/models/title.model'
import { Collection } from './collection.model'

@ObjectType()
export class TitleCollectionItem {
    @Field(() => String)
    id: string

    @Field(() => String)
    collectionId: string

    @Field(() => String)
    titleId: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Int)
    position: number

    @Field(() => Collection)
    collection: Collection

    @Field(() => Title)
    title: Title
}
