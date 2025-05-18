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
            distributionRatio?: {
                title: number
                location: number
                collection: number
            }
        } = {
            withLikes: true,
            withReplies: true,
            replyProbability: 0.4,
            maxRepliesPerComment: 5,
            distributionRatio: { title: 0.5, location: 0.3, collection: 0.2 },
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

            const collectionsData = await this.db.query.collections.findMany({
                limit: 150,
            })

            if (
                !titlesData.length &&
                !filmingLocationsData.length &&
                !collectionsData.length
            ) {
                this.logger.warn(
                    'No titles, filming locations, or collections found to seed comments',
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

            const {
                title: titleRatio,
                location: locationRatio,
                collection: collectionRatio,
            } = this.adjustDistributionRatio(options.distributionRatio, {
                titlesAvailable: titlesData.length > 0,
                locationsAvailable: filmingLocationsData.length > 0,
                collectionsAvailable: collectionsData.length > 0,
            })

            const titleCommentsCount = Math.floor(count * titleRatio)
            const locationCommentsCount = Math.floor(count * locationRatio)
            const collectionCommentsCount =
                count - titleCommentsCount - locationCommentsCount

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

            await this.createParentComments(
                collectionsData,
                activeUsers,
                collectionCommentsCount,
                CommentableType.COLLECTION,
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

    private adjustDistributionRatio(
        ratio: { title: number; location: number; collection: number },
        available: {
            titlesAvailable: boolean
            locationsAvailable: boolean
            collectionsAvailable: boolean
        },
    ): { title: number; location: number; collection: number } {
        const { titlesAvailable, locationsAvailable, collectionsAvailable } =
            available

        if (titlesAvailable && locationsAvailable && collectionsAvailable) {
            return ratio
        }

        let adjustedRatio = { title: 0, location: 0, collection: 0 }
        let totalAvailableRatio = 0

        if (titlesAvailable) {
            adjustedRatio.title = ratio.title
            totalAvailableRatio += ratio.title
        }

        if (locationsAvailable) {
            adjustedRatio.location = ratio.location
            totalAvailableRatio += ratio.location
        }

        if (collectionsAvailable) {
            adjustedRatio.collection = ratio.collection
            totalAvailableRatio += ratio.collection
        }

        if (totalAvailableRatio > 0) {
            adjustedRatio.title /= totalAvailableRatio
            adjustedRatio.location /= totalAvailableRatio
            adjustedRatio.collection /= totalAvailableRatio
        }

        return adjustedRatio
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
                const message = this.generateCommentMessage(commentableType)

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

    private generateCommentMessage(commentableType: CommentableType): string {
        switch (commentableType) {
            case CommentableType.TITLE:
                return faker.lorem.paragraph(1 + Math.floor(Math.random() * 3))
            case CommentableType.LOCATION:
                return faker.lorem.sentences(1 + Math.floor(Math.random() * 4))
            case CommentableType.COLLECTION:
                return faker.helpers.arrayElement([
                    faker.lorem.paragraph(1 + Math.floor(Math.random() * 2)),
                    `Great collection! ${faker.lorem.sentence()}`,
                    `I love how these are organized. ${faker.lorem.sentences(1)}`,
                    faker.lorem.sentences(2 + Math.floor(Math.random() * 2)),
                ])
            default:
                return faker.lorem.sentences(1 + Math.floor(Math.random() * 3))
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
                            message: this.generateReplyMessage(
                                i,
                                repliesCount,
                                commentableType as CommentableType,
                            ),
                            createdAt,
                            updatedAt: createdAt,
                        })
                    }
                }
            }
        }

        return replyCommentsBatch
    }

    private generateReplyMessage(
        index: number,
        totalReplies: number,
        commentableType: CommentableType,
    ): string {
        if (
            commentableType === CommentableType.COLLECTION &&
            Math.random() > 0.7
        ) {
            const collectionReplies = [
                'I really appreciate your thoughts on this collection.',
                'Have you seen the other items in this collection?',
                'This is actually one of my favorite collections too!',
                'Would you recommend this collection to beginners?',
                "Good point about this collection's organization.",
            ]
            return (
                faker.helpers.arrayElement(collectionReplies) +
                ' ' +
                faker.lorem.sentence()
            )
        }

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
                const isCollectionComment =
                    comment.commentableType === CommentableType.COLLECTION
                const maxLikes = comment.parentId
                    ? isCollectionComment
                        ? 5
                        : 3
                    : isCollectionComment
                      ? 12
                      : 8

                const likeChance = isCollectionComment ? 0.8 : 0.7
                const numberOfLikes = Math.floor(Math.random() * maxLikes)

                if (Math.random() > 1 - likeChance && numberOfLikes > 0) {
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
