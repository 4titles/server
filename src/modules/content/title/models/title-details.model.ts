import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TitleDetails {
    @Field(() => Number, { nullable: true })
    budget?: number

    @Field(() => Number, { nullable: true })
    revenue?: number

    @Field(() => Number, { nullable: true })
    runtime?: number

    @Field(() => String, { nullable: true })
    tagline?: string

    @Field(() => String, { nullable: true })
    homepage?: string

    @Field(() => Number, { nullable: true })
    vote_average?: number

    @Field(() => Number, { nullable: true })
    vote_count?: number

    @Field(() => String, { nullable: true })
    release_date?: string
}
