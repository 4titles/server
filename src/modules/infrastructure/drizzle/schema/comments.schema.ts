import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { commentLikes } from './comment-likes.schema'
import { commentableTypeEnum } from './enums.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const comments = pgTable(
    'comments',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        commentableId: uuid('commentable_id').notNull(),
        parentId: uuid('parent_id').references((): any => comments.id, {
            onDelete: 'cascade',
        }),
        commentableType: commentableTypeEnum('commentable_type'),
        message: text('message').notNull(),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('comments_user_id_idx').on(table.userId),
        commentableIdx: index('comments_commentable_idx').on(
            table.commentableType,
            table.commentableId,
        ),
        parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
    }),
)

export const commentsRelations = relations(comments, ({ one, many }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    title: one(titles, {
        fields: [comments.commentableId],
        references: [titles.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: 'replies',
    }),
    replies: many(comments, {
        relationName: 'replies',
    }),
    likes: many(commentLikes),
}))

export type DbComment = typeof comments.$inferSelect
export type DbCommentInsert = typeof comments.$inferInsert
