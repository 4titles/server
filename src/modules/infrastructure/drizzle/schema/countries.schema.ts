import { relations } from 'drizzle-orm'
import { index, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { titleCountries } from './title-countries.schema'

export const countries = pgTable(
    'countries',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        nativeName: varchar('native_name'),
    },
    (table) => ({
        isoUnique: unique('iso_unique_idx'),
        englishNameIndex: index('english_name_idx').on(table.englishName),
        nativeNameIndex: index('native_name_idx').on(table.nativeName),
    }),
)

export const countriesRelations = relations(countries, ({ many }) => ({
    titles: many(titleCountries),
}))

export type DbCountry = typeof countries.$inferSelect
export type DbCountryInsert = typeof countries.$inferInsert
