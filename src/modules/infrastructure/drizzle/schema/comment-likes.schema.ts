import { relations } from 'drizzle-orm'
import { pgTable, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { comments } from './comments.schema'
import { users } from './users.schema'

export const commentLikes = pgTable(
    'comment_likes',
    {
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        commentId: uuid('comment_id')
            .references(() => comments.id, { onDelete: 'cascade' })
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        userCommentIdx: unique('comment_likes_user_comment_idx').on(
            table.userId,
            table.commentId,
        ),
    }),
)

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
    user: one(users, {
        fields: [commentLikes.userId],
        references: [users.id],
    }),
    comment: one(comments, {
        fields: [commentLikes.commentId],
        references: [comments.id],
    }),
}))

export type DbCommentLike = typeof commentLikes.$inferSelect
export type DbCommentLikeInsert = typeof commentLikes.$inferInsert
