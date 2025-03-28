import { relations } from 'drizzle-orm'
import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { languages } from './languages.schema'
import { titles } from './titles.schema'

export const titleTranslations = pgTable(
    'title_translations',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        titleId: uuid('title_id')
            .references(() => titles.id, { onDelete: 'cascade' })
            .notNull(),
        languageId: uuid('language_id')
            .references(() => languages.id, { onDelete: 'cascade' })
            .notNull(),
        title: text('title').notNull(),
        overview: text('overview'),
        tagline: text('tagline'),
        homepage: text('homepage'),
        ...timestamps,
    },
    (table) => ({
        titleLanguageIdx: unique('title_translations_title_language_idx').on(
            table.titleId,
            table.languageId,
        ),
    }),
)

export const titleTranslationsRelations = relations(
    titleTranslations,
    ({ one }) => ({
        title: one(titles, {
            fields: [titleTranslations.titleId],
            references: [titles.id],
        }),
        language: one(languages, {
            fields: [titleTranslations.languageId],
            references: [languages.id],
        }),
    }),
)

export type DbTitleTranslation = typeof titleTranslations.$inferSelect
export type DbTitleTranslationInsert = typeof titleTranslations.$inferInsert
