import { FilmingLocationProposalStatus } from '@/modules/content/title/modules/filming-location/modules/filming-location-proposal/enums/filming-location-proposal-status.enum'
import { relations } from 'drizzle-orm'
import {
    index,
    pgTable,
    point,
    text,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import {
    filmingLocationProposalStatusEnum,
    filmingLocationProposalTypeEnum,
} from './enums.schema'
import { filmingLocations } from './filming-locations.schema'
import { titles } from './titles.schema'
import { users } from './users.schema'

export const filmingLocationProposals = pgTable(
    'filming_location_proposals',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        type: filmingLocationProposalTypeEnum('type').notNull(),
        status: filmingLocationProposalStatusEnum('status')
            .notNull()
            .default(FilmingLocationProposalStatus.PENDING),

        address: text('address').notNull(),
        coordinates: point('coordinates', { mode: 'xy' }),
        description: text('description'),
        locationId: uuid('location_id').references(() => filmingLocations.id, {
            onDelete: 'cascade',
        }),
        userId: uuid('user_id')
            .references(() => users.id, {
                onDelete: 'set null',
            })
            .notNull(),
        titleId: uuid('title_id')
            .references(() => titles.id, { onDelete: 'set null' })
            .notNull(),
        reason: text('reason').notNull(),
        reviewMessage: text('review_message'),
        ...timestamps,
    },
    (table) => ({
        addressIdx: index('filming_location_proposals_address_idx').on(
            table.address,
        ),
        statusIdx: index('filming_location_proposals_status_idx').on(
            table.status,
        ),
        typeIdx: index('filming_location_proposals_type_idx').on(table.type),
        userIdx: index('filming_location_proposals_user_idx').on(table.userId),
        uniqueComboIdx: uniqueIndex('flp_unique_addr_desc_loc_user_idx').on(
            table.address,
            table.description,
            table.locationId,
            table.userId,
        ),
    }),
)

export const filmingLocationProposalsRelations = relations(
    filmingLocationProposals,
    ({ one }) => ({
        location: one(filmingLocations, {
            fields: [filmingLocationProposals.locationId],
            references: [filmingLocations.id],
        }),
        user: one(users, {
            fields: [filmingLocationProposals.userId],
            references: [users.id],
        }),
        title: one(titles, {
            fields: [filmingLocationProposals.titleId],
            references: [titles.id],
        }),
    }),
)

export type DbFilmingLocationProposal =
    typeof filmingLocationProposals.$inferSelect
export type DbFilmingLocationProposalInsert =
    typeof filmingLocationProposals.$inferInsert
