import { Field, ObjectType } from '@nestjs/graphql'
import { TitleSyncStatus } from '../enums/title-sync-status.enum'

@ObjectType()
export class TitleSyncResult {
    @Field(() => TitleSyncStatus)
    status: TitleSyncStatus

    @Field(() => String)
    timestamp: Date

    @Field(() => Number)
    total: number

    @Field(() => Number)
    processed: number

    @Field(() => [String])
    failed: string[]

    @Field(() => String, { nullable: true })
    error?: string
}
