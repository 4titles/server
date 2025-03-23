import { Field, ObjectType } from '@nestjs/graphql'
import { TmdbGenre } from '../../tmdb/models/tmdb-genre.model'

@ObjectType()
export class GenresByLanguage {
    @Field(() => [TmdbGenre], { nullable: true })
    en?: TmdbGenre[]

    @Field(() => [TmdbGenre], { nullable: true })
    ru?: TmdbGenre[]
}
