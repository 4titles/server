import { Field, InputType } from '@nestjs/graphql'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { FilmingLocationProposalStatus } from '../enums/filming-location-proposal-status.enum'

@InputType()
export class UpdateFilmingLocationProposalStatusInput {
    @Field(() => String)
    @IsUUID('4')
    proposalId: string

    @Field(() => FilmingLocationProposalStatus)
    @IsEnum(FilmingLocationProposalStatus)
    status: FilmingLocationProposalStatus

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    reviewMessage?: string
}
