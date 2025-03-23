import { FeedbackStatus } from '@/modules/content/feedback/enums/feedback-status.enum'
import { FeedbackType } from '@/modules/content/feedback/enums/feedback-type.enum'
import { relations } from 'drizzle-orm'
import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import {
    feedbackSourceEnum,
    feedbackStatusEnum,
    feedbackTypeEnum,
} from './enums.schema'
import { users } from './users.schema'

export const feedbacks = pgTable(
    'feedbacks',
    {
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
        ...timestamps,
        respondedAt: timestamp('responded_at', { withTimezone: true }),
    },
    (table) => ({
        typeIdx: index('feedbacks_type_idx').on(table.type),
        sourceIdx: index('feedbacks_source_idx').on(table.source),
        statusIdx: index('feedbacks_status_idx').on(table.status),
        userIdIdx: index('feedbacks_user_id_idx').on(table.userId),
        createdAtIdx: index('feedbacks_created_at_idx').on(table.createdAt),
    }),
)

export const feedbackRelations = relations(feedbacks, ({ one }) => ({
    user: one(users, {
        fields: [feedbacks.userId],
        references: [users.id],
    }),
}))

export type DbFeedback = typeof feedbacks.$inferSelect
