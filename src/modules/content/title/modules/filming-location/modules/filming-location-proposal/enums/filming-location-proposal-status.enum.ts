import { registerEnumType } from '@nestjs/graphql'

export enum FilmingLocationProposalStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

registerEnumType(FilmingLocationProposalStatus, {
    name: 'FilmingLocationProposalStatus',
})
