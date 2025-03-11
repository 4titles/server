import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, avg, count, eq, isNotNull } from 'drizzle-orm'
import { User } from '../auth/account/models/user.model'
import { DRIZZLE } from '../drizzle/drizzle.module'
import { DbFeedback, feedbacks } from '../drizzle/schema/feedbacks.schema'
import { DrizzleDB } from '../drizzle/types/drizzle'
import { NotificationService } from '../notification/notification.service'
import { FeedbackSource } from './enums/feedback-source.enum'
import { FeedbackStatus } from './enums/feedback-status.enum'
import { FeedbackType } from './enums/feedback-type.enum'
import { CreateFeedbackInput } from './inputs/create-feedback.input'
import { FilterFeedbackInput } from './inputs/filter-feedback.input'
import { UpdateFeedbackStatusInput } from './inputs/update-feedback-status.input'
import { FeedbackStats } from './models/feedback-stats.model'
import { FeedbackSubmitResponse } from './models/feedback-submit-response.model'
import { Feedback } from './models/feedback.model'

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name)

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly notificationService: NotificationService,
    ) {}

    async create(
        input: CreateFeedbackInput,
        user?: User,
        source: FeedbackSource = FeedbackSource.WEBSITE,
    ): Promise<FeedbackSubmitResponse> {
        try {
            const newFeedback = {
                message: input.message,
                type: input.type || FeedbackType.GENERAL,
                source,
                rating: input.rating,
                userId: user?.id || null,
                status: FeedbackStatus.NEW,
            }

            const [createdFeedback] = await this.db
                .insert(feedbacks)
                .values(newFeedback)
                .returning()

            if (input.type === FeedbackType.BUG_REPORT) {
                await this.notificationService.notifyAdminsAboutBugReport(
                    createdFeedback,
                    user,
                )
            }

            return {
                success: true,
                message:
                    'Ваш отзыв успешно отправлен. Спасибо за помощь в улучшении платформы!',
                feedback: createdFeedback,
            }
        } catch (error) {
            this.logger.error(
                `Failed to create feedback: ${error.message}`,
                error.stack,
            )
            return {
                success: false,
                message:
                    'Произошла ошибка при отправке отзыва. Пожалуйста, попробуйте позже.',
            }
        }
    }

    async createFromTelegram(
        user: User,
        message: string,
        type: FeedbackType = FeedbackType.GENERAL,
        rating?: number,
    ): Promise<Feedback> {
        try {
            const newFeedback = {
                message,
                type,
                source: FeedbackSource.TELEGRAM,
                rating,
                userId: user.id,
                status: FeedbackStatus.NEW,
            }

            const [createdFeedback] = await this.db
                .insert(feedbacks)
                .values(newFeedback)
                .returning()

            if (type === FeedbackType.BUG_REPORT) {
                await this.notificationService.notifyAdminsAboutBugReport(
                    createdFeedback,
                    user,
                )
            }

            return createdFeedback
        } catch (error) {
            this.logger.error(
                `Failed to create feedback from Telegram: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async findAll(filters?: FilterFeedbackInput): Promise<Feedback[]> {
        try {
            let query = this.db.query.feedbacks.findMany({
                orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
                with: {
                    user: true,
                },
            })

            if (filters) {
                const conditions = []

                if (filters.type) {
                    conditions.push(eq(feedbacks.type, filters.type))
                }

                if (filters.source) {
                    conditions.push(eq(feedbacks.source, filters.source))
                }

                if (filters.status) {
                    conditions.push(eq(feedbacks.status, filters.status))
                }

                if (filters.userId) {
                    conditions.push(eq(feedbacks.userId, filters.userId))
                }

                if (conditions.length > 0) {
                    query = this.db.query.feedbacks.findMany({
                        where: and(...conditions),
                        orderBy: (feedback, { desc }) => [
                            desc(feedback.createdAt),
                        ],
                        with: {
                            user: true,
                        },
                    })
                }
            }

            return await query
        } catch (error) {
            this.logger.error(
                `Failed to get feedback list: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async findById(id: string): Promise<Feedback> {
        try {
            return await this.db.query.feedbacks.findFirst({
                where: eq(feedbacks.id, id),
                with: {
                    user: true,
                },
            })
        } catch (error) {
            this.logger.error(
                `Failed to get feedback by ID: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async findByUser(userId: string): Promise<Feedback[]> {
        try {
            return await this.db.query.feedbacks.findMany({
                where: eq(feedbacks.userId, userId),
                orderBy: (feedback, { desc }) => [desc(feedback.createdAt)],
            })
        } catch (error) {
            this.logger.error(
                `Failed to get user feedback: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async updateStatus(input: UpdateFeedbackStatusInput): Promise<Feedback> {
        try {
            const feedbackItem = await this.findById(input.id)

            if (!feedbackItem) {
                throw new Error(`Feedback with ID ${input.id} not found`)
            }

            const updateData: Partial<DbFeedback> = {
                status: input.status,
                updatedAt: new Date(),
            }

            if (input.responseMessage) {
                updateData.responseMessage = input.responseMessage
                updateData.respondedAt = new Date()
            }

            const [updatedFeedback] = await this.db
                .update(feedbacks)
                .set(updateData)
                .where(eq(feedbacks.id, input.id))
                .returning()

            if (feedbackItem.user?.telegramId && input.responseMessage) {
                await this.notificationService.notifyUserAboutFeedbackResponse(
                    feedbackItem.user.telegramId,
                    updatedFeedback,
                )
            }

            return {
                ...updatedFeedback,
                user: feedbackItem.user,
            }
        } catch (error) {
            this.logger.error(
                `Failed to update feedback status: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    async getStats(filters?: FilterFeedbackInput): Promise<FeedbackStats> {
        try {
            const conditions = []
            if (filters) {
                if (filters.type) {
                    conditions.push(eq(feedbacks.type, filters.type))
                }
                if (filters.source) {
                    conditions.push(eq(feedbacks.source, filters.source))
                }
                if (filters.status) {
                    conditions.push(eq(feedbacks.status, filters.status))
                }
                if (filters.userId) {
                    conditions.push(eq(feedbacks.userId, filters.userId))
                }
            }
            const whereClause = conditions.length
                ? and(...conditions)
                : undefined

            const totalResult = await this.db
                .select({ count: count() })
                .from(feedbacks)
                .where(whereClause)

            const statusCounts = await this.db
                .select({
                    status: feedbacks.status,
                    count: count(),
                })
                .from(feedbacks)
                .where(whereClause)
                .groupBy(feedbacks.status)

            const typeCounts = await this.db
                .select({
                    type: feedbacks.type,
                    count: count(),
                })
                .from(feedbacks)
                .where(whereClause)
                .groupBy(feedbacks.type)

            const ratingWhereClause = whereClause
                ? and(whereClause, isNotNull(feedbacks.rating))
                : isNotNull(feedbacks.rating)

            const avgRatingResult = await this.db
                .select({
                    averageRating: avg(feedbacks.rating),
                })
                .from(feedbacks)
                .where(ratingWhereClause)

            const total = totalResult[0]?.count || 0

            const statusCountMap = statusCounts.reduce(
                (acc, item) => {
                    acc[item.status] = item.count
                    return acc
                },
                {} as Record<string, number>,
            )

            const typeCountMap = typeCounts.reduce(
                (acc, item) => {
                    acc[item.type] = item.count
                    return acc
                },
                {} as Record<string, number>,
            )

            return {
                total,
                newCount: statusCountMap[FeedbackStatus.NEW] || 0,
                inProgressCount:
                    statusCountMap[FeedbackStatus.IN_PROGRESS] || 0,
                resolvedCount: statusCountMap[FeedbackStatus.RESOLVED] || 0,
                closedCount: statusCountMap[FeedbackStatus.CLOSED] || 0,
                rejectedCount: statusCountMap[FeedbackStatus.REJECTED] || 0,
                bugReportsCount: typeCountMap[FeedbackType.BUG_REPORT] || 0,
                featureRequestsCount:
                    typeCountMap[FeedbackType.FEATURE_REQUEST] || 0,
                averageRating:
                    avgRatingResult.length && avgRatingResult[0]?.averageRating
                        ? Math.round(
                              Number(avgRatingResult[0]?.averageRating) * 10,
                          ) / 10
                        : 0,
            }
        } catch (error) {
            this.logger.error(
                `Failed to get feedback stats: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
