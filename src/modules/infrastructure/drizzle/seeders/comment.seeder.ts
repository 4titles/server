import { CommentableType } from '@/modules/content/comment/enums/commentable-type.enum'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { users } from '@/modules/infrastructure/drizzle/schema/users.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { faker } from '@faker-js/faker'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { commentLikes } from '../schema/comment-likes.schema'
import { comments } from '../schema/comments.schema'

@Injectable()
export class CommentSeeder {
    private readonly logger = new Logger(CommentSeeder.name)

    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async seed(
        count: number = 50,
        options: { withLikes: boolean } = { withLikes: true },
    ): Promise<number> {
        this.logger.log(`Starting to seed ${count} comments`)

        try {
            const titlesData = await this.db.query.titles.findMany({
                limit: 50,
            })

            if (!titlesData.length) {
                this.logger.warn('No titles found to seed comments')
                return 0
            }

            const activeUsers = await this.db.query.users.findMany({
                where: eq(users.isDeactivated, false),
                limit: 30,
            })

            if (!activeUsers.length) {
                this.logger.warn('No active users found to seed comments')
                return 0
            }

            await this.cleanup()

            const commentsBatch = []
            let createdCount = 0
            const now = new Date()

            const parentCommentsByTitle = new Map<string, string[]>()

            const parentCommentsCount = Math.floor(count * 0.7)

            for (let i = 0; i < parentCommentsCount; i++) {
                const randomTitleIndex = Math.floor(
                    Math.random() * titlesData.length,
                )
                const title = titlesData[randomTitleIndex]

                const randomUserIndex = Math.floor(
                    Math.random() * activeUsers.length,
                )
                const user = activeUsers[randomUserIndex]

                const commentId = uuidv4()
                const createdAt = faker.date.past({ years: 1 })

                commentsBatch.push({
                    id: commentId,
                    userId: user.id,
                    commentableId: title.id,
                    commentableType: CommentableType.TITLE,
                    message: faker.lorem.paragraph(),
                    createdAt,
                    updatedAt: createdAt,
                })

                if (!parentCommentsByTitle.has(title.id)) {
                    parentCommentsByTitle.set(title.id, [])
                }
                parentCommentsByTitle.get(title.id).push(commentId)

                createdCount++
            }

            const childCommentsCount = count - parentCommentsCount

            for (let i = 0; i < childCommentsCount; i++) {
                const titlesWithComments = Array.from(
                    parentCommentsByTitle.keys(),
                )

                if (titlesWithComments.length === 0) {
                    break
                }

                const randomTitleIndex = Math.floor(
                    Math.random() * titlesWithComments.length,
                )
                const titleId = titlesWithComments[randomTitleIndex]

                const parentComments = parentCommentsByTitle.get(titleId)
                const randomParentIndex = Math.floor(
                    Math.random() * parentComments.length,
                )
                const parentId = parentComments[randomParentIndex]

                const randomUserIndex = Math.floor(
                    Math.random() * activeUsers.length,
                )
                const user = activeUsers[randomUserIndex]

                const commentId = uuidv4()
                const createdAt = faker.date.past({ years: 1 })

                commentsBatch.push({
                    id: commentId,
                    userId: user.id,
                    commentableId: titleId,
                    commentableType: CommentableType.TITLE,
                    parentId,
                    message: faker.lorem.sentences(2),
                    createdAt,
                    updatedAt: createdAt,
                })

                createdCount++
            }

            if (commentsBatch.length > 0) {
                await this.db.insert(comments).values(commentsBatch)

                if (options.withLikes) {
                    await this.seedLikes(commentsBatch, activeUsers)
                }
            }

            this.logger.log(`Successfully seeded ${createdCount} comments`)
            return createdCount
        } catch (error) {
            this.logger.error(
                `Failed to seed comments: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    private async seedLikes(
        comments: any[],
        activeUsers: any[],
    ): Promise<void> {
        try {
            const likesBatch = []
            let likeCount = 0

            for (const comment of comments) {
                const numberOfLikes = Math.floor(Math.random() * 6)

                const shuffledUsers = [...activeUsers].sort(
                    () => Math.random() - 0.5,
                )
                const usersForLikes = shuffledUsers.slice(0, numberOfLikes)

                for (const user of usersForLikes) {
                    if (user.id === comment.userId) continue

                    likesBatch.push({
                        userId: user.id,
                        commentId: comment.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    likeCount++
                }
            }

            if (likesBatch.length > 0) {
                await this.db.insert(commentLikes).values(likesBatch)
                this.logger.log(`Added ${likeCount} likes to comments`)
            }
        } catch (error) {
            this.logger.error(
                `Failed to seed likes: ${error.message}`,
                error.stack,
            )
        }
    }

    async cleanup(): Promise<number> {
        try {
            await this.db.delete(commentLikes)

            const result = await this.db.delete(comments)
            const deletedCount = result.rowCount || 0
            this.logger.log(`Cleaned up ${deletedCount} comments`)
            return deletedCount
        } catch (error) {
            this.logger.error(
                `Failed to clean up comments: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
