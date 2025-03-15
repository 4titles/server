import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { titleNetworks } from './title-networks.schema'

export const networks = pgTable('networks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tmdbId: text('tmdb_id').unique(),
    name: text('name').notNull(),
    logoPath: text('logo_path'),
    originCountry: text('origin_country'),
})

export const networksRelations = relations(networks, ({ many }) => ({
    titles: many(titleNetworks),
}))

export type DbNetwork = typeof networks.$inferSelect
export type DbNetworkInsert = typeof networks.$inferInsert
