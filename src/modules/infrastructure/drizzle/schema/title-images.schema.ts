import { timestamps } from '@/modules/infrastructure/drizzle/helpers/column.helpers'
import { titleImageTypeEnum } from '@/modules/infrastructure/drizzle/schema/enums.schema'
import { languages } from '@/modules/infrastructure/drizzle/schema/languages.schema'
import { titles } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { relations } from 'drizzle-orm'
import {
    index,
    integer,
    pgTable,
    real,
    text,
    unique,
    uuid,
} from 'drizzle-orm/pg-core'

export const titleImages = pgTable(
    'title_images',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        titleId: uuid('title_id')
            .references(() => titles.id, { onDelete: 'cascade' })
            .notNull(),
        languageId: uuid('language_id').references(() => languages.id, {
            onDelete: 'set null',
        }),
        type: titleImageTypeEnum('type').notNull(),
        filePath: text('file_path').notNull().unique(),
        aspectRatio: real('aspect_ratio'),
        voteAverage: real('vote_average'),
        voteCount: integer('vote_count'),
        ...timestamps,
    },
    (table) => ({
        titleIdIdx: index('title_images_title_id_idx').on(table.titleId),
        languageIdIdx: index('title_images_language_id_idx').on(
            table.languageId,
        ),
        typeIdx: index('title_images_type_idx').on(table.type),
        titleIdTypeIdx: index('title_images_title_id_type_idx').on(
            table.titleId,
            table.type,
        ),
        uniqueImageIdx: unique('title_images_unique_idx').on(
            table.titleId,
            table.type,
            table.filePath,
        ),
    }),
)

export const titleImagesRelations = relations(titleImages, ({ one }) => ({
    title: one(titles, {
        fields: [titleImages.titleId],
        references: [titles.id],
    }),
    language: one(languages, {
        fields: [titleImages.languageId],
        references: [languages.id],
    }),
}))

export type DbTitleImage = typeof titleImages.$inferSelect
export type DbTitleImageInsert = typeof titleImages.$inferInsert
