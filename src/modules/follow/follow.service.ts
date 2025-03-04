import {
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import { User } from '../auth/account/models/user.model'
import { DRIZZLE } from '../drizzle/drizzle.module'
import { follows } from '../drizzle/schema/follows.schema'
import { users } from '../drizzle/schema/users.schema'
import { DrizzleDB } from '../drizzle/types/drizzle'

@Injectable()
export class FollowService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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
}
