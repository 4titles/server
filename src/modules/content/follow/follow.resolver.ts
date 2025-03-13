import { Authorization } from '@/shared/decorators/auth.decorator'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../../auth/account/models/user.model'
import { FollowService } from './follow.service'
import { Follow } from './models/follow.model'

@Resolver()
export class FollowResolver {
    constructor(private readonly followService: FollowService) {}

    @Authorization()
    @Query(() => [Follow])
    async findUserFollowers(@Authorized() user: User) {
        return await this.followService.findUserFollowers(user)
    }

    @Authorization()
    @Query(() => [Follow])
    async findUserFollowings(@Authorized() user: User) {
        return await this.followService.findUserFollowings(user)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async followUser(
        @Authorized() user: User,
        @Args('followingId') followingId: string,
    ) {
        return await this.followService.follow(user, followingId)
    }

    @Authorization()
    @Mutation(() => Boolean)
    async unfollowUser(
        @Authorized() user: User,
        @Args('followingId') followingId: string,
    ) {
        return await this.followService.unfollow(user, followingId)
    }

    @Authorization()
    @Query(() => [User])
    async findRecommendedUsers() {
        return await this.followService.findRecommendedUsers()
    }

    @Authorization()
    @Query(() => Number)
    async findFollowersCountByUser(@Args('userId') userId: string) {
        return await this.followService.findFollowersCountByUser(userId)
    }
}
