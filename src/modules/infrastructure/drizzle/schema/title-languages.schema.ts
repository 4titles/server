import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { titleLanguageTypeEnum } from './enums.schema'
import { languages } from './languages.schema'
import { titles } from './titles.schema'

export const titleLanguages = pgTable(
    'title_languages',
    {
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        languageId: uuid('language_id')
            .references(() => languages.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        type: titleLanguageTypeEnum('type').notNull(),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.titleId, table.languageId, table.type],
        }),
    }),
)

export const titleLanguagesRelations = relations(titleLanguages, ({ one }) => ({
    title: one(titles, {
        fields: [titleLanguages.titleId],
        references: [titles.id],
    }),
    language: one(languages, {
        fields: [titleLanguages.languageId],
        references: [languages.id],
    }),
}))

export type DbTitleLanguage = typeof titleLanguages.$inferSelect
export type DbTitleLanguageInsert = typeof titleLanguages.$inferInsert
