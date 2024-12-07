import { registerEnumType } from '@nestjs/graphql'

export enum MovieStatus {
    RUMORED = 'Rumored',
    PLANNED = 'Planned',
    IN_PRODUCTION = 'In Production',
    POST_PRODUCTION = 'Post Production',
    RELEASED = 'Released',
    CANCELED = 'Canceled',
}

registerEnumType(MovieStatus, {
    name: 'MovieStatus',
    description: 'The status of the movie',
})
