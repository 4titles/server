import { relations } from 'drizzle-orm'
import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { titleComments } from './title-comments.schema'
import { users } from './users.schema'

export const titleCommentLikes = pgTable(
    'title_comment_likes',
    {
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        commentId: uuid('comment_id')
            .references(() => titleComments.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.commentId] }),
        userIdIdx: index('title_comment_likes_user_id_idx').on(table.userId),
        commentIdIdx: index('title_comment_likes_comment_id_idx').on(
            table.commentId,
        ),
    }),
)

export const titleCommentLikesRelations = relations(
    titleCommentLikes,
    ({ one }) => ({
        user: one(users, {
            fields: [titleCommentLikes.userId],
            references: [users.id],
        }),
        comment: one(titleComments, {
            fields: [titleCommentLikes.commentId],
            references: [titleComments.id],
        }),
    }),
)

export type DbTitleCommentLike = typeof titleCommentLikes.$inferSelect
export type DbTitleCommentLikeInsert = typeof titleCommentLikes.$inferInsert
