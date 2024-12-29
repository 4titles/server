import { Field, ObjectType, Int } from '@nestjs/graphql'

@ObjectType()
export class LocationsSyncResult {
    @Field(() => Boolean)
    success: boolean

    @Field(() => Int)
    processedCount: number

    @Field(() => Int)
    failedCount: number

    @Field(() => [String])
    errors: string[]

    @Field(() => [String])
    syncedImdbIds: string[]
}
