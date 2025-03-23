import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class TitleSyncStats {
    @Field(() => Number)
    totalProcessed: number

    @Field(() => Number)
    totalFailed: number

    @Field(() => Number)
    totalLocationsSynced: number
}

@ObjectType()
export class TitleSyncResult {
    @Field(() => Boolean)
    success: boolean

    @Field(() => String)
    message: string

    @Field(() => TitleSyncStats)
    stats: TitleSyncStats
}
