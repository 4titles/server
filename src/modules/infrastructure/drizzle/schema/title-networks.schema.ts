import { relations } from 'drizzle-orm'
import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { networks } from './networks.schema'
import { titles } from './titles.schema'

export const titleNetworks = pgTable(
    'title_networks',
    {
        titleId: uuid('title_id')
            .references(() => titles.id, {
                onDelete: 'cascade',
            })
            .notNull(),
        networkId: uuid('network_id')
            .references(() => networks.id, {
                onDelete: 'cascade',
            })
            .notNull(),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.titleId, table.networkId] }),
        titleIdIdx: index('title_networks_title_id_idx').on(table.titleId),
        networkIdIdx: index('title_networks_network_id_idx').on(
            table.networkId,
        ),
    }),
)

export const titleNetworksRelations = relations(titleNetworks, ({ one }) => ({
    title: one(titles, {
        fields: [titleNetworks.titleId],
        references: [titles.id],
    }),
    network: one(networks, {
        fields: [titleNetworks.networkId],
        references: [networks.id],
    }),
}))

export type DbTitleNetwork = typeof titleNetworks.$inferSelect
export type DbTitleNetworkInsert = typeof titleNetworks.$inferInsert
