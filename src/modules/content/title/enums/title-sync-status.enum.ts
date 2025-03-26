import { registerEnumType } from '@nestjs/graphql'

export enum TitleSyncStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PARTIAL = 'PARTIAL',
    PENDING = 'PENDING',
}

registerEnumType(TitleSyncStatus, { name: 'TitleSyncStatus' })
