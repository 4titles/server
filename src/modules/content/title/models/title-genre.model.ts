import { Field, ObjectType } from '@nestjs/graphql'
import { Genre } from '../modules/genre/models/genre.model'
import { Title } from './title.model'

@ObjectType()
export class TitleGenre {
    @Field(() => String)
    titleId: string

    @Field(() => String)
    genreId: string

    @Field(() => Title)
    title: Title

    @Field(() => Genre)
    genre: Genre
}
