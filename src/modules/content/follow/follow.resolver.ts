import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '../../auth/account/models/user.model'
import { FollowService } from './follow.service'
import { Follow } from './models/follow.model'

@Resolver()
export class FollowResolver {
    constructor(private readonly followService: FollowService) {}

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Follow])
    async findUserFollowers(@Authorized() user: User) {
        return await this.followService.findUserFollowers(user)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'own',
    })
    @Query(() => [Follow])
    async findUserFollowings(@Authorized() user: User) {
        return await this.followService.findUserFollowings(user)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async followUser(
        @Authorized() user: User,
        @Args('followingId') followingId: string,
    ) {
        return await this.followService.follow(user, followingId)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.UPDATE,
        possession: 'own',
    })
    @Mutation(() => Boolean)
    async unfollowUser(
        @Authorized() user: User,
        @Args('followingId') followingId: string,
    ) {
        return await this.followService.unfollow(user, followingId)
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [User])
    async findRecommendedUsers() {
        return await this.followService.findRecommendedUsers()
    }

    @RbacProtected({
        resource: Resource.USER,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Number)
    async findFollowersCountByUser(@Args('userId') userId: string) {
        return await this.followService.findFollowersCountByUser(userId)
    }
}
