import { relations } from 'drizzle-orm'
import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { productionCompanies } from './production-companies.schema'
import { titles } from './titles.schema'

export const titleProductionCompanies = pgTable(
    'title_production_companies',
    {
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        productionCompanyId: uuid('production_company_id')
            .references(() => productionCompanies.id, { onDelete: 'cascade' })
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.titleId, table.productionCompanyId] }),
        titleIdIdx: index('title_production_companies_title_id_idx').on(
            table.titleId,
        ),
        productionCompanyIdIdx: index(
            'title_production_companies_production_company_id_idx',
        ).on(table.productionCompanyId),
    }),
)

export const titleProductionCompaniesRelations = relations(
    titleProductionCompanies,
    ({ one }) => ({
        title: one(titles, {
            fields: [titleProductionCompanies.titleId],
            references: [titles.id],
        }),
        productionCompany: one(productionCompanies, {
            fields: [titleProductionCompanies.productionCompanyId],
            references: [productionCompanies.id],
        }),
    }),
)

export type TitleProductionCompany =
    typeof titleProductionCompanies.$inferSelect
export type TitleProductionCompanyInsert =
    typeof titleProductionCompanies.$inferInsert
