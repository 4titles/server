import { FeedbackSource } from '@/modules/feedback/enums/feedback-source.enum'
import { FeedbackStatus } from '@/modules/feedback/enums/feedback-status.enum'
import { FeedbackType } from '@/modules/feedback/enums/feedback-type.enum'
import { relations } from 'drizzle-orm'
import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const feedbackTypeEnum = pgEnum('feedback_type_enum', [
    FeedbackType.GENERAL,
    FeedbackType.BUG_REPORT,
    FeedbackType.FEATURE_REQUEST,
    FeedbackType.CONTENT_ISSUE,
    FeedbackType.OTHER,
] as const)

export const feedbackSourceEnum = pgEnum('feedback_source_enum', [
    FeedbackSource.WEBSITE,
    FeedbackSource.TELEGRAM,
    FeedbackSource.EMAIL,
    FeedbackSource.OTHER,
] as const)

export const feedbackStatusEnum = pgEnum('feedback_status_enum', [
    FeedbackStatus.NEW,
    FeedbackStatus.IN_PROGRESS,
    FeedbackStatus.RESOLVED,
    FeedbackStatus.CLOSED,
    FeedbackStatus.REJECTED,
] as const)

export const feedbacks = pgTable('feedbacks', {
    id: uuid('id').primaryKey().defaultRandom(),
    message: text('message').notNull(),
    type: feedbackTypeEnum('type').default(FeedbackType.GENERAL),
    source: feedbackSourceEnum('source').notNull(),
    rating: integer('rating'),
    status: feedbackStatusEnum('status').default(FeedbackStatus.NEW),
    responseMessage: text('response_message'),
    userId: uuid('user_id').references(() => users.id, {
        onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
})

export const feedbackRelations = relations(feedbacks, ({ one }) => ({
    user: one(users, {
        fields: [feedbacks.userId],
        references: [users.id],
    }),
}))

export type DbFeedback = typeof feedbacks.$inferSelect
