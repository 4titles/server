import { Field, ObjectType } from '@nestjs/graphql'
import { SimplePerson } from './simple-person.model'
import { Title } from './title.model'

@ObjectType()
export class SeriesDetails {
    @Field(() => String)
    titleId: string

    @Field(() => [SimplePerson])
    createdBy: SimplePerson[]

    @Field(() => [Number])
    episodeRunTime: number[]

    @Field(() => Boolean)
    inProduction: boolean

    @Field(() => Date, { nullable: true })
    firstAirDate?: Date

    @Field(() => Date, { nullable: true })
    lastAirDate: Date

    @Field(() => Number)
    numberOfEpisodes: number

    @Field(() => Number)
    numberOfSeasons: number

    @Field(() => Title)
    title: Title
}
