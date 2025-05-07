import { registerEnumType } from '@nestjs/graphql'

export enum FilmingLocationProposalType {
    ADD = 'ADD',
    EDIT = 'EDIT',
}

registerEnumType(FilmingLocationProposalType, {
    name: 'FilmingLocationProposalType',
})
