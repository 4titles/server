import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { countries } from './countries.schema'
import { countryRelationTypeEnum } from './enums.schema'
import { titles } from './titles.schema'

export const titleCountries = pgTable(
    'title_countries',
    {
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        countryId: uuid('country_id')
            .references(() => countries.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        type: countryRelationTypeEnum('type').notNull(),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.titleId, table.countryId, table.type],
        }),
    }),
)

export const titleCountriesRelations = relations(titleCountries, ({ one }) => ({
    title: one(titles, {
        fields: [titleCountries.titleId],
        references: [titles.id],
    }),
    country: one(countries, {
        fields: [titleCountries.countryId],
        references: [countries.id],
    }),
}))

export type DbTitleCountry = typeof titleCountries.$inferSelect
export type DbTitleCountryInsert = typeof titleCountries.$inferInsert
