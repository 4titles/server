import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { commentLikes } from '@/modules/infrastructure/drizzle/schema/comment-likes.schema'
import { comments } from '@/modules/infrastructure/drizzle/schema/comments.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { dateReviver } from '@/shared/utils/time/date-reviver.util'
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { and, asc, desc, eq, isNull, sql, SQL } from 'drizzle-orm'
import { TitleService } from '../../title/services/title.service'
import { CommentSortOption } from '../enums/comment-sort-option.enum'
import { CommentableType } from '../enums/commentable-type.enum'
import { CommentFilterInput } from '../inputs/comment-filter.input'
import { CreateCommentInput } from '../inputs/create-comment.input'
import { DeleteCommentInput } from '../inputs/delete-comment.input'
import { ToggleLikeCommentInput } from '../inputs/toggle-like-comment.input'
import { UpdateCommentInput } from '../inputs/update-comment.input'
import { Comment } from '../models/comment.model'
import { CommentCacheService } from './comment-cache.service'

@Injectable()
export class CommentService {
    private readonly logger = new Logger(CommentService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly titleService: TitleService,
        private readonly commentCacheService: CommentCacheService,
    ) {}

    async findById(commentId: string, userId?: string): Promise<Comment> {
        const comment = await this.db.query.comments.findFirst({
            where: eq(comments.id, commentId),
            with: {
                user: true,
                title: true,
                parent: {
                    with: {
                        user: true,
                        likes: true,
                    },
                },
                likes: true,
            },
        })

        if (!comment) {
            throw new NotFoundException(
                `Comment with ID ${commentId} not found`,
            )
        }

        const enrichedComment = this.enrichCommentWithLikesData(comment, userId)

        if (enrichedComment.parent) {
            enrichedComment.parent = this.enrichCommentWithLikesData(
                enrichedComment.parent,
                userId,
            )
        }

        const replies = await this.loadRepliesRecursively(commentId, userId)
        enrichedComment.replies = replies

        return enrichedComment
    }

    async findComments(
        input: CommentFilterInput,
        userId?: string,
    ): Promise<Comment[]> {
        const { commentableType, commentableId, take, skip, sortBy } = input

        try {
            const cacheKey = this.commentCacheService.getCommentsCacheKey(input)
            const cachedComments =
                await this.commentCacheService.getComments(input)
            if (cachedComments && !userId) {
                this.logger.debug(`Cache hit for comments: ${cacheKey}`)
                return JSON.parse(cachedComments, (key, value) =>
                    dateReviver(['createdAt', 'updatedAt'], key, value),
                )
            }

            let orderBy: SQL[] = [desc(comments.createdAt)]

            if (sortBy) {
                switch (sortBy) {
                    case CommentSortOption.LIKES_DESC:
                        orderBy = [
                            sql`(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = comments.id) DESC`,
                            desc(comments.createdAt),
                        ]
                        break
                    case CommentSortOption.LIKES_ASC:
                        orderBy = [
                            sql`(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = comments.id) ASC`,
                            desc(comments.createdAt),
                        ]
                        break
                    case CommentSortOption.DATE_DESC:
                        orderBy = [desc(comments.createdAt)]
                        break
                    case CommentSortOption.DATE_ASC:
                        orderBy = [asc(comments.createdAt)]
                        break
                    case CommentSortOption.REPLIES_DESC:
                        orderBy = [
                            sql`(SELECT COUNT(*) FROM comments replies WHERE replies.parent_id = comments.id) DESC`,
                            desc(comments.createdAt),
                        ]
                        break
                    case CommentSortOption.REPLIES_ASC:
                        orderBy = [
                            sql`(SELECT COUNT(*) FROM comments replies WHERE replies.parent_id = comments.id) ASC`,
                            desc(comments.createdAt),
                        ]
                        break
                    default:
                        orderBy = [desc(comments.createdAt)]
                }
            }

            const parentComments = await this.db.query.comments.findMany({
                where: and(
                    eq(comments.commentableType, commentableType),
                    eq(comments.commentableId, commentableId),
                    isNull(comments.parentId),
                ),
                with: {
                    user: true,
                    title: true,
                    likes: true,
                },
                orderBy,
                limit: take,
                offset: skip,
            })

            const enrichedParentComments = parentComments.map((comment) =>
                this.enrichCommentWithLikesData(comment, userId),
            )

            for (const comment of enrichedParentComments) {
                comment.replies = await this.loadRepliesRecursively(
                    comment.id,
                    userId,
                )

                comment['totalReplies'] = this.countTotalReplies(comment)
            }

            if (!userId) {
                await this.commentCacheService.storeComments(
                    input,
                    enrichedParentComments,
                )
            }

            return enrichedParentComments
        } catch (error) {
            this.logger.error(
                `Error fetching comments for ${input.commentableType} ${input.commentableId}:`,
                error,
            )
            throw error
        }
    }

    async create(input: CreateCommentInput, userId: string): Promise<boolean> {
        const { commentableType, commentableId, parentId, message } = input

        try {
            await this.verifyCommentableEntityExists(
                commentableType,
                commentableId,
            )

            if (parentId) {
                const parentComment = await this.db.query.comments.findFirst({
                    where: eq(comments.id, parentId),
                })

                if (!parentComment) {
                    throw new NotFoundException(
                        `Parent comment with ID ${parentId} not found`,
                    )
                }

                if (
                    parentComment.commentableId !== commentableId ||
                    parentComment.commentableType !== commentableType
                ) {
                    throw new Error(
                        'Parent comment belongs to a different entity',
                    )
                }
            }

            const commentToInsert = {
                userId,
                commentableType,
                commentableId,
                parentId,
                message,
            }

            await this.db.insert(comments).values(commentToInsert)

            await this.commentCacheService.invalidateCommentsCache(
                commentableType,
                commentableId,
            )

            return true
        } catch (error) {
            this.logger.error(`Error creating comment:`, error)
            return false
        }
    }

    async update(input: UpdateCommentInput, userId: string): Promise<boolean> {
        const { commentId, message } = input

        try {
            const comment = await this.findById(commentId)

            if (!comment) {
                throw new NotFoundException(
                    `Comment with ID ${commentId} not found`,
                )
            }

            if (comment.userId !== userId) {
                throw new Error('You can only edit your own comments')
            }

            const commentUpdate = {
                message,
                updatedAt: new Date(),
            }

            await this.db
                .update(comments)
                .set(commentUpdate)
                .where(eq(comments.id, commentId))

            await this.commentCacheService.invalidateCommentsCache(
                comment.commentableType,
                comment.commentableId,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to update comment with ID ${commentId}`,
                error,
            )
            return false
        }
    }

    async delete(input: DeleteCommentInput, userId: string): Promise<boolean> {
        const { commentId } = input

        try {
            const comment = await this.findById(commentId)

            if (!comment) {
                throw new NotFoundException(
                    `Comment with ID ${commentId} not found`,
                )
            }

            if (comment.userId !== userId) {
                throw new Error('You can only delete your own comments')
            }

            const commentableType = comment.commentableType
            const commentableId = comment.commentableId

            await this.db.delete(comments).where(eq(comments.id, commentId))

            await this.commentCacheService.invalidateCommentsCache(
                commentableType,
                commentableId,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to delete comment with ID ${commentId}`,
                error,
            )

            return false
        }
    }

    async toggleLike(
        input: ToggleLikeCommentInput,
        userId: string,
    ): Promise<boolean> {
        const { commentId } = input

        try {
            const comment = await this.findById(commentId)

            if (!comment) {
                throw new NotFoundException(
                    `Comment with ID ${commentId} not found`,
                )
            }

            const existingLike = await this.db.query.commentLikes.findFirst({
                where: and(
                    eq(commentLikes.commentId, commentId),
                    eq(commentLikes.userId, userId),
                ),
            })

            if (existingLike) {
                await this.db
                    .delete(commentLikes)
                    .where(
                        and(
                            eq(commentLikes.commentId, commentId),
                            eq(commentLikes.userId, userId),
                        ),
                    )
            } else {
                await this.db.insert(commentLikes).values({
                    commentId,
                    userId,
                })
            }

            await this.commentCacheService.invalidateCommentsCache(
                comment.commentableType,
                comment.commentableId,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to toggle like for comment ${commentId}:`,
                error,
            )
            return false
        }
    }

    private async verifyCommentableEntityExists(
        commentableType: CommentableType,
        commentableId: string,
    ): Promise<void> {
        switch (commentableType) {
            case CommentableType.TITLE:
                const titleExists =
                    await this.titleService.findById(commentableId)
                if (!titleExists) {
                    throw new NotFoundException(
                        `Title with ID ${commentableId} not found`,
                    )
                }
                break
            case CommentableType.LOCATION:
                break
            case CommentableType.COLLECTION:
                break
            default:
                throw new Error(
                    `Unsupported commentable type: ${commentableType}`,
                )
        }
    }

    private enrichCommentWithLikesData(comment: any, userId?: string): Comment {
        const likeCount = comment.likes?.length || 0
        const likedByMe = userId
            ? comment.likes?.some((like: any) => like.userId === userId) ||
              false
            : false

        return {
            ...comment,
            likeCount,
            likedByMe,
        }
    }

    private async loadRepliesRecursively(
        parentId: string,
        userId?: string,
    ): Promise<Comment[]> {
        const directReplies = await this.db.query.comments.findMany({
            where: eq(comments.parentId, parentId),
            with: {
                user: true,
                likes: true,
            },
            orderBy: [desc(comments.createdAt)],
        })

        if (!directReplies.length) {
            return []
        }

        const enrichedReplies = directReplies.map((reply) =>
            this.enrichCommentWithLikesData(reply, userId),
        )

        for (const reply of enrichedReplies) {
            reply.replies = await this.loadRepliesRecursively(reply.id, userId)
            reply.totalReplies = this.countTotalReplies(reply)
        }

        return enrichedReplies
    }

    private countTotalReplies(comment: Comment): number {
        if (!comment.replies || comment.replies.length === 0) {
            return 0
        }

        let count = comment.replies.length

        for (const reply of comment.replies) {
            count += this.countTotalReplies(reply)
        }

        return count
    }
}
