import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { commentableTypeEnum } from './enums.schema'
import { titleFilmingLocations } from './title-filming-locations.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const comments = pgTable(
    'comments',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        titleId: uuid('title_id').references(() => titles.id, {
            onDelete: 'cascade',
        }),
        locationId: uuid('location_id').references(
            () => titleFilmingLocations.id,
            {
                onDelete: 'cascade',
            },
        ),
        parentId: uuid('parent_id').references((): any => comments.id, {
            onDelete: 'cascade',
        }),
        content: text('content').notNull(),
        type: commentableTypeEnum('type').notNull(),
        ...timestamps,
    },
    (table) => ({
        userIdIdx: index('comments_user_id_idx').on(table.userId),
        titleIdIdx: index('comments_title_id_idx').on(table.titleId),
        locationIdIdx: index('comments_location_id_idx').on(table.locationId),
        parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
        typeIdx: index('comments_type_idx').on(table.type),
    }),
)

export const commentsRelations = relations(comments, ({ one, many }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    title: one(titles, {
        fields: [comments.titleId],
        references: [titles.id],
    }),
    location: one(titleFilmingLocations, {
        fields: [comments.locationId],
        references: [titleFilmingLocations.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: 'replies',
    }),
    replies: many(comments, {
        relationName: 'replies',
    }),
}))

export type DbComment = typeof comments.$inferSelect
export type DbCommentInsert = typeof comments.$inferInsert
