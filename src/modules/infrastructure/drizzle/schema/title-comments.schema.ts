import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { titleCommentLikes } from './title-comment-likes.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const titleComments = pgTable(
    'title_comments',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        titleId: uuid('title_id')
            .references(() => titles.id, { onDelete: 'cascade' })
            .notNull(),
        parentId: uuid('parent_id').references((): any => titleComments.id, {
            onDelete: 'cascade',
        }),
        message: text('message').notNull(),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('title_comments_user_id_idx').on(table.userId),
        titleIdIdx: index('title_comments_title_id_idx').on(table.titleId),
        parentIdIdx: index('title_comments_parent_id_idx').on(table.parentId),
    }),
)

export const titleCommentsRelations = relations(
    titleComments,
    ({ one, many }) => ({
        user: one(users, {
            fields: [titleComments.userId],
            references: [users.id],
        }),
        title: one(titles, {
            fields: [titleComments.titleId],
            references: [titles.id],
        }),
        parent: one(titleComments, {
            fields: [titleComments.parentId],
            references: [titleComments.id],
            relationName: 'replies',
        }),
        replies: many(titleComments, {
            relationName: 'replies',
        }),
        likes: many(titleCommentLikes),
    }),
)

export type DbTitleComment = typeof titleComments.$inferSelect
export type DbTitleCommentInsert = typeof titleComments.$inferInsert
