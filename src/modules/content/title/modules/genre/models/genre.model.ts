import { Field, ObjectType } from '@nestjs/graphql'
import { Title } from '../../../models/title.model'

@ObjectType()
export class Genre {
    @Field(() => String)
    id: string

    @Field(() => String)
    tmdbId: string

    @Field(() => String)
    name: string

    @Field(() => String, { nullable: true })
    englishName?: string

    @Field(() => [Title], { nullable: true })
    titles?: Title[]
}
