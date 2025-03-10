import {
    ConflictException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { User } from '../auth/account/models/user.model'
import { DRIZZLE } from '../drizzle/drizzle.module'
import { follows } from '../drizzle/schema/follows.schema'
import { users } from '../drizzle/schema/users.schema'
import { DrizzleDB } from '../drizzle/types/drizzle'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class FollowService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,
    ) {}

    async findUserFollowers(user: User) {
        return await this.db.query.follows.findMany({
            where: eq(follows.followingId, user.id),
            orderBy: desc(follows.createdAt),
            with: {
                follower: true,
            },
        })
    }

    async findUserFollowings(user: User) {
        return await this.db.query.follows.findMany({
            where: eq(follows.followerId, user.id),
            orderBy: desc(follows.createdAt),
            with: {
                following: true,
            },
        })
    }

    async follow(user: User, followingId: string): Promise<boolean> {
        const following = await this.db.query.users.findFirst({
            where: eq(users.id, followingId),
            with: { notificationSettings: true },
        })

        if (!following) {
            throw new NotFoundException('User not found')
        }

        if (following.id === user.id) {
            throw new ConflictException('You cannot follow yourself')
        }

        const existingFollow = await this.db.query.follows.findFirst({
            where: and(
                eq(follows.followerId, user.id),
                eq(follows.followingId, following.id),
            ),
        })

        if (existingFollow) {
            throw new ConflictException('You are already following this user')
        }

        await this.db.insert(follows).values({
            followerId: user.id,
            followingId: following.id,
        })

        if (following.notificationSettings?.isSiteNotificationsEnabled) {
            await this.notificationService.createNewFollowingUserNotification(
                following.id,
                user,
            )
        }

        if (
            following.notificationSettings?.isTelegramNotificationsEnabled &&
            following.telegramId
        ) {
            await this.telegramService.sendNewFollowing(
                following.telegramId,
                user,
            )
        }

        return true
    }

    async unfollow(user: User, followingId: string): Promise<boolean> {
        const following = await this.db.query.users.findFirst({
            where: eq(users.id, followingId),
        })

        if (!following) {
            throw new NotFoundException('User not found')
        }

        if (following.id === user.id) {
            throw new ConflictException('You cannot unfollow yourself')
        }

        const existingFollow = await this.db.query.follows.findFirst({
            where: and(
                eq(follows.followerId, user.id),
                eq(follows.followingId, following.id),
            ),
        })

        if (!existingFollow) {
            throw new ConflictException('You are not following this user')
        }

        await this.db
            .delete(follows)
            .where(
                and(
                    eq(follows.id, existingFollow.id),
                    eq(follows.followerId, user.id),
                    eq(follows.followingId, following.id),
                ),
            )

        return true
    }

    async findRecommendedUsers() {
        return await this.db.query.users.findMany({
            where: eq(users.isDeactivated, false),
            with: {
                followers: {
                    limit: 1,
                },
            },
            extras: {
                followersCount: sql<number>`(
                    SELECT COUNT(*)
                    FROM follows
                    WHERE follows.following_id = users.id
                )`.as('followers_count'),
            },
            orderBy: (_, { desc }) => desc(sql`followers_count`),
            limit: 7,
        })
    }

    async findFollowersCountByUser(userId: string): Promise<number> {
        const followers = await this.db
            .select({ count: count() })
            .from(follows)
            .where(eq(follows.followingId, userId))

        return followers[0]?.count ?? 0
    }
}
