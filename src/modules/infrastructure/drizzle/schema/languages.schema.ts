import { relations } from 'drizzle-orm'
import { index, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { titleLanguages } from './title-languages.schema'

export const languages = pgTable(
    'languages',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        name: varchar('name').default(''),
    },
    (table) => ({
        isoUnique: unique('iso_unique_idx').on(table.iso),
        englishNameIndex: index('english_name_index').on(table.englishName),
        nameIndex: index('name_index').on(table.name),
    }),
)

export const languagesRelations = relations(languages, ({ many }) => ({
    titles: many(titleLanguages),
}))

export type DbLanguage = typeof languages.$inferSelect
export type DbLanguageInsert = typeof languages.$inferInsert
