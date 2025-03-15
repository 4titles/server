import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { countries } from './countries.schema'
import { titleProductionCompanies } from './title-production-companies.schema'

export const productionCompanies = pgTable('production_companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: text('tmdb_id').unique(),
    name: text('name').notNull(),
    logoPath: text('logo_path'),
    originContryId: uuid('origin_country_id').references(() => countries.id, {
        onDelete: 'set null',
    }),
})

export const productionCompaniesRelations = relations(
    productionCompanies,
    ({ one, many }) => ({
        titles: many(titleProductionCompanies),
        country: one(countries),
    }),
)

export type DbProductionCompany = typeof productionCompanies.$inferSelect
export type DbProductionCompanyInsert = typeof productionCompanies.$inferInsert
