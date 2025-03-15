import { Field, ObjectType } from '@nestjs/graphql'
import { Title } from './title.model'

@ObjectType()
export class MovieDetails {
    @Field(() => String)
    titleId: string

    @Field(() => Number)
    budget: number

    @Field(() => Number)
    revenue: number

    @Field(() => Number)
    runtime: number

    @Field(() => Date, { nullable: true })
    releaseDate?: Date

    @Field(() => Title)
    title: Title
}
