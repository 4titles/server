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
        count: number = 100,
        options: {
            withLikes: boolean
            withReplies: boolean
            replyProbability: number
            maxRepliesPerComment: number
        } = {
            withLikes: true,
            withReplies: true,
            replyProbability: 0.4,
            maxRepliesPerComment: 5,
        },
    ): Promise<number> {
        this.logger.log(`Starting to seed ${count} comments`)

        try {
            const titlesData = await this.db.query.titles.findMany({
                limit: 150,
            })

            const filmingLocationsData =
                await this.db.query.filmingLocations.findMany({
                    limit: 150,
                })

            if (!titlesData.length && !filmingLocationsData.length) {
                this.logger.warn(
                    'No titles or filming locations found to seed comments',
                )
                return 0
            }

            const activeUsers = await this.db.query.users.findMany({
                where: eq(users.isDeactivated, false),
                limit: 50,
            })

            if (!activeUsers.length) {
                this.logger.warn('No active users found to seed comments')
                return 0
            }

            await this.cleanup()

            const commentsBatch = []
            let createdCount = 0

            const parentCommentsByCommentable = new Map<
                string,
                Array<{ id: string; createdAt: Date }>
            >()

            const titleCommentsCount =
                titlesData.length > 0
                    ? Math.floor(
                          count * (filmingLocationsData.length > 0 ? 0.6 : 1),
                      )
                    : 0

            const locationCommentsCount = count - titleCommentsCount

            await this.createParentComments(
                titlesData,
                activeUsers,
                titleCommentsCount,
                CommentableType.TITLE,
                parentCommentsByCommentable,
                commentsBatch,
            )

            await this.createParentComments(
                filmingLocationsData,
                activeUsers,
                locationCommentsCount,
                CommentableType.LOCATION,
                parentCommentsByCommentable,
                commentsBatch,
            )

            createdCount = commentsBatch.length

            if (options.withReplies) {
                const replyCommentsBatch = await this.createReplyComments(
                    parentCommentsByCommentable,
                    activeUsers,
                    options.replyProbability,
                    options.maxRepliesPerComment,
                )

                commentsBatch.push(...replyCommentsBatch)
                createdCount = commentsBatch.length
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

    private async createParentComments(
        commentableItems: any[],
        activeUsers: any[],
        count: number,
        commentableType: CommentableType,
        parentCommentsByCommentable: Map<
            string,
            Array<{ id: string; createdAt: Date }>
        >,
        commentsBatch: any[],
    ): Promise<void> {
        if (commentableItems.length === 0 || count === 0) return

        const commentsPerItem = Math.max(
            1,
            Math.floor(count / commentableItems.length),
        )

        for (const item of commentableItems) {
            const itemCommentsCount = Math.min(
                commentsPerItem + Math.floor(Math.random() * 3) - 1,
                Math.ceil((count / commentableItems.length) * 2),
            )

            for (let i = 0; i < itemCommentsCount; i++) {
                const randomUserIndex = Math.floor(
                    Math.random() * activeUsers.length,
                )
                const user = activeUsers[randomUserIndex]

                const commentId = uuidv4()
                const message =
                    commentableType === CommentableType.TITLE
                        ? faker.lorem.paragraph(
                              1 + Math.floor(Math.random() * 3),
                          )
                        : faker.lorem.sentences(
                              1 + Math.floor(Math.random() * 4),
                          )

                const createdAt = faker.date.past({ years: 1 })

                commentsBatch.push({
                    id: commentId,
                    userId: user.id,
                    commentableId: item.id,
                    commentableType,
                    message,
                    createdAt,
                    updatedAt: createdAt,
                })

                const key = `${commentableType}:${item.id}`
                if (!parentCommentsByCommentable.has(key)) {
                    parentCommentsByCommentable.set(key, [])
                }
                parentCommentsByCommentable
                    .get(key)
                    .push({ id: commentId, createdAt })
            }
        }
    }

    private async createReplyComments(
        parentCommentsByCommentable: Map<
            string,
            Array<{ id: string; createdAt: Date }>
        >,
        activeUsers: any[],
        replyProbability: number,
        maxRepliesPerComment: number,
    ): Promise<any[]> {
        const replyCommentsBatch = []
        const parentCommentsToFetch = []

        for (const [
            commentableKey,
            parentComments,
        ] of parentCommentsByCommentable.entries()) {
            const [commentableType, commentableId] = commentableKey.split(':')

            for (const parentComment of parentComments) {
                if (Math.random() <= replyProbability) {
                    parentCommentsToFetch.push(parentComment.id)

                    const repliesCount =
                        2 +
                        Math.floor(Math.random() * (maxRepliesPerComment - 1))

                    for (let i = 0; i < repliesCount; i++) {
                        const randomUserIndex = Math.floor(
                            Math.random() * activeUsers.length,
                        )
                        const user = activeUsers[randomUserIndex]

                        const createdAt = new Date(
                            parentComment.createdAt.getTime() +
                                Math.random() *
                                    (Date.now() -
                                        parentComment.createdAt.getTime()),
                        )

                        replyCommentsBatch.push({
                            id: uuidv4(),
                            userId: user.id,
                            commentableId: commentableId,
                            commentableType: commentableType as CommentableType,
                            parentId: parentComment.id,
                            message: this.generateReplyMessage(i, repliesCount),
                            createdAt,
                            updatedAt: createdAt,
                        })
                    }
                }
            }
        }

        return replyCommentsBatch
    }

    private generateReplyMessage(index: number, totalReplies: number): string {
        if (index === 0) {
            return faker.lorem.sentences(1 + Math.floor(Math.random() * 3))
        } else if (index === totalReplies - 1) {
            return faker.lorem.sentence()
        } else {
            return faker.lorem.sentences(1 + Math.floor(Math.random() * 2))
        }
    }

    private async seedLikes(
        commentBatch: any[],
        activeUsers: any[],
    ): Promise<void> {
        try {
            const likesBatch = []
            let likeCount = 0

            for (const comment of commentBatch) {
                const maxLikes = comment.parentId ? 3 : 8
                const numberOfLikes = Math.floor(Math.random() * maxLikes)

                if (Math.random() > 0.7 && numberOfLikes > 0) {
                    const shuffledUsers = [...activeUsers].sort(
                        () => Math.random() - 0.5,
                    )
                    const usersForLikes = shuffledUsers.slice(0, numberOfLikes)

                    for (const user of usersForLikes) {
                        if (user.id === comment.userId) continue

                        const timeSinceComment =
                            Date.now() - comment.createdAt.getTime()
                        const likeCreatedAt = new Date(
                            comment.createdAt.getTime() +
                                Math.random() * timeSinceComment,
                        )

                        likesBatch.push({
                            userId: user.id,
                            commentId: comment.id,
                            createdAt: likeCreatedAt,
                            updatedAt: likeCreatedAt,
                        })
                        likeCount++
                    }
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
