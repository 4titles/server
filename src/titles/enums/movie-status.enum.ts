import { registerEnumType } from '@nestjs/graphql'

export enum MovieStatus {
    Rumored = 'Rumored',
    Planned = 'Planned',
    InProduction = 'In Production',
    PostProduction = 'Post Production',
    Released = 'Released',
    Canceled = 'Canceled',
}

registerEnumType(MovieStatus, {
    name: 'MovieStatus',
    description: 'The status of the movie',
})
