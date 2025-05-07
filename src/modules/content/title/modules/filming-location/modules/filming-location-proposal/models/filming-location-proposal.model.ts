import { User } from '@/modules/auth/account/models/user.model'
import { Field, ObjectType } from '@nestjs/graphql'
import { Title } from '../../../../../models/title.model'
import { FilmingLocation, Point } from '../../../models/filming-location.model'
import { FilmingLocationProposalStatus } from '../enums/filming-location-proposal-status.enum'
import { FilmingLocationProposalType } from '../enums/filming-location-proposal-type.enum'

@ObjectType()
export class FilmingLocationProposal {
    @Field(() => String)
    id: string

    @Field(() => FilmingLocationProposalType)
    type: FilmingLocationProposalType

    @Field(() => FilmingLocationProposalStatus)
    status: FilmingLocationProposalStatus

    @Field(() => String)
    address: string

    @Field(() => Point)
    coordinates: Point

    @Field(() => String, { nullable: true })
    description?: string

    @Field(() => FilmingLocation, { nullable: true })
    location?: FilmingLocation

    @Field(() => Title)
    title: Partial<Title>

    @Field(() => User)
    user: User

    @Field(() => String)
    reason: string

    @Field(() => String, { nullable: true })
    reviewMessage?: string

    @Field(() => Date)
    createdAt: Date

    @Field(() => Date)
    updatedAt: Date
}
