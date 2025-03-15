import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { countries } from './countries.schema'
import { titleNetworks } from './title-networks.schema'

export const networks = pgTable('networks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: text('tmdb_id').unique(),
    name: text('name').notNull(),
    logoPath: text('logo_path'),
    originContryId: uuid('origin_country_id').references(() => countries.id, {
        onDelete: 'set null',
    }),
})

export const networksRelations = relations(networks, ({ one, many }) => ({
    titles: many(titleNetworks),
    country: one(countries),
}))

export type DbNetwork = typeof networks.$inferSelect
export type DbNetworkInsert = typeof networks.$inferInsert
