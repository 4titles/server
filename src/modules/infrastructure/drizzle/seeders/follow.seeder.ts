import { faker } from '@faker-js/faker'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { DRIZZLE } from '../drizzle.module'
import { follows } from '../schema/follows.schema'
import { users } from '../schema/users.schema'
import { DrizzleDB } from '../types/drizzle'

@Injectable()
export class FollowSeeder {
    private readonly logger = new Logger(FollowSeeder.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async seed(
        options: {
            minFollowsPerUser?: number
            maxFollowsPerUser?: number
            followProbability?: number
        } = {},
    ): Promise<number> {
        this.logger.log('Starting to seed follows')

        const activeUsers = await this.db.query.users.findMany({
            where: eq(users.isDeactivated, false),
        })

        if (activeUsers.length < 2) {
            this.logger.warn('Not enough active users to create follows')
            return 0
        }

        const followsBatch = []
        let createdFollowsCount = 0

        const minFollows = options.minFollowsPerUser ?? 0
        const maxFollows = options.maxFollowsPerUser ?? 10
        const followProbability = options.followProbability ?? 0.3

        for (const follower of activeUsers) {
            const potentialFollowings = activeUsers.filter(
                (user) => user.id !== follower.id,
            )

            let followsCount: number
            if (minFollows === maxFollows) {
                followsCount = Math.min(minFollows, potentialFollowings.length)
            } else {
                followsCount = Math.min(
                    faker.number.int({
                        min: minFollows,
                        max: maxFollows,
                    }),
                    potentialFollowings.length,
                )
            }

            const shuffledUsers = [...potentialFollowings].sort(
                () => Math.random() - 0.5,
            )
            const followingsToCreate = shuffledUsers.slice(0, followsCount)

            for (const following of followingsToCreate) {
                if (Math.random() > followProbability) continue

                followsBatch.push({
                    id: uuidv4(),
                    followerId: follower.id,
                    followingId: following.id,
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                })

                createdFollowsCount++

                if (followsBatch.length >= 1000) {
                    await this._insertBatch(followsBatch)
                    followsBatch.length = 0
                    this.logger.log(
                        `Seeded batch of follows (progress: ${createdFollowsCount} follows created)`,
                    )
                }
            }
        }

        if (followsBatch.length > 0) {
            await this._insertBatch(followsBatch)
            this.logger.log(`Seeded final batch of follows`)
        }

        this.logger.log(`Successfully seeded ${createdFollowsCount} follows`)
        return createdFollowsCount
    }

    async seedTestFollows(): Promise<number> {
        this.logger.log('Starting to seed test follows')

        const testUsers = await this.db.query.users.findMany({
            where: eq(users.isVerified, true),
        })

        if (testUsers.length < 2) {
            this.logger.warn('Not enough test users to create follows')
            return 0
        }

        const testFollowsBatch = []
        let createdTestFollowsCount = 0

        const adminUser = testUsers[0]

        for (let i = 0; i < testUsers.length; i++) {
            const follower = testUsers[i]

            if (follower.id !== adminUser.id) {
                testFollowsBatch.push({
                    id: uuidv4(),
                    followerId: follower.id,
                    followingId: adminUser.id,
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                })
                createdTestFollowsCount++
            }

            if (i > 0 && follower.id !== adminUser.id) {
                testFollowsBatch.push({
                    id: uuidv4(),
                    followerId: adminUser.id,
                    followingId: follower.id,
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                })
                createdTestFollowsCount++
            }

            if (i > 1 && i % 2 === 0) {
                testFollowsBatch.push({
                    id: uuidv4(),
                    followerId: testUsers[1].id,
                    followingId: follower.id,
                    createdAt: faker.date.past(),
                    updatedAt: faker.date.recent(),
                })
                createdTestFollowsCount++
            }
        }

        await this._insertBatch(testFollowsBatch)
        this.logger.log(
            `Successfully seeded ${createdTestFollowsCount} test follows`,
        )
        return createdTestFollowsCount
    }

    async cleanup(): Promise<number> {
        try {
            const result = await this.db.delete(follows)
            const deletedCount = result.rowCount || 0
            this.logger.log(`Cleaned up ${deletedCount} follows`)
            return deletedCount
        } catch (error) {
            this.logger.error(
                `Failed to clean up follows: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    private async _insertBatch(followsBatch: any[]): Promise<void> {
        try {
            await this.db
                .insert(follows)
                .values(followsBatch)
                .onConflictDoNothing()
        } catch (error) {
            this.logger.error(
                `Failed to insert follows batch: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
