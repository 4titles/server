import { registerEnumType } from '@nestjs/graphql'

export enum NotificationType {
    ENABLE_TWO_FACTOR = 'ENABLE_TWO_FACTOR',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_FAVORITE_TITLE_LOCATION = 'NEW_FAVORITE_TITLE_LOCATION',
    FILMING_LOCATION_PROPOSAL_STATUS_UPDATE = 'FILMING_LOCATION_PROPOSAL_STATUS_UPDATE',
    INFO = 'INFO',
}

registerEnumType(NotificationType, {
    name: 'NotificationType',
    description: 'The type of notification',
})
