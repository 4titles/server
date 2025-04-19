import {
    integer,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { titles } from './titles.schema'

export const popularTitles = pgTable(
    'popular_titles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        titleId: uuid('title_id')
            .notNull()
            .references(() => titles.id, { onDelete: 'cascade' }),
        count: integer('count').notNull().default(1),
        ...timestamps,
    },
    (table) => ({
        titleIdIdx: uniqueIndex('popular_titles_title_id_idx').on(
            table.titleId,
        ),
    }),
)

export type DbPopularTitle = typeof popularTitles.$inferSelect
export type DbPopularTitleInsert = typeof popularTitles.$inferInsert
