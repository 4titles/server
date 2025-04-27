import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { filmingLocations } from './filming-locations.schema'
import { titleCountries } from './title-countries.schema'

export const countries = pgTable(
    'countries',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        iso: text('iso').notNull().unique(),
        name: text('name'),
        englishName: text('english_name').notNull(),
        flagUrl: text('flag_url'),
        ...timestamps,
    },
    (table) => ({
        isoIdx: index('countries_iso_idx').on(table.iso),
        nameIdx: index('countries_name_idx').on(table.name),
        englishNameIdx: index('countries_english_name_idx').on(
            table.englishName,
        ),
    }),
)

export const countriesRelations = relations(countries, ({ many }) => ({
    titles: many(titleCountries),
    filmingLocations: many(filmingLocations),
}))

export type DbCountry = typeof countries.$inferSelect
export type DbCountryInsert = typeof countries.$inferInsert
