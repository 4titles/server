import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class SyncResult {
    @Field(() => Int)
    moviesCount: number

    @Field(() => Int)
    tvShowsCount: number
}
