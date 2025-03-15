import { registerEnumType } from '@nestjs/graphql'

export enum TitleStatus {
    RUMORED = 'Rumored',
    PLANNED = 'Planned',
    IN_PRODUCTION = 'In Production',
    POST_PRODUCTION = 'Post Production',
    RELEASED = 'Released',
    CANCELED = 'Canceled',
    AIRING = 'Airing',
}

registerEnumType(TitleStatus, {
    name: 'TitleStatus',
    description: 'The status of the title',
})
