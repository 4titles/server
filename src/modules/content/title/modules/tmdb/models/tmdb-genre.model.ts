import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TmdbGenre {
    @Field(() => Number, { nullable: true })
    id?: number

    @Field(() => String, { nullable: true })
    name?: string
}
