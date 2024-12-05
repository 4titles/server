import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class FullSyncResult {
    @Field(() => Int)
    popularMoviesCount: number

    @Field(() => Int)
    popularTvShowsCount: number

    @Field(() => Int)
    trendingMoviesCount: number

    @Field(() => Int)
    trendingTvShowsCount: number

    @Field(() => Int)
    topRatedMoviesCount: number

    @Field(() => Int)
    topRatedTvShowsCount: number
}
