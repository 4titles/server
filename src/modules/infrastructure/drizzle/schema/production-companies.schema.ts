import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { titleProductionCompanies } from './title-production-companies.schema'

export const productionCompanies = pgTable('production_companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: text('tmdb_id').unique(),
    name: text('name').notNull(),
    logoPath: text('logo_path'),
    originCountry: text('origin_country'),
})

export const productionCompaniesRelations = relations(
    productionCompanies,
    ({ many }) => ({
        titles: many(titleProductionCompanies),
    }),
)

export type DbProductionCompany = typeof productionCompanies.$inferSelect
export type DbProductionCompanyInsert = typeof productionCompanies.$inferInsert
