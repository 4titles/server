import { bigint, index, pgTable, text, unique } from 'drizzle-orm/pg-core'
import { movies } from './movies.schema'
import { series } from './series.schema'
import { timestamps } from '../helpers/column.helpers'

export const locations = pgTable(
    'locations',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        address: text('address').notNull(),
        latitude: text('latitude'),
        longitude: text('longitude'),
        ...timestamps,
    },
    (table) => ({
        addressIdx: index('locations_address_idx').on(table.address),
    }),
)

export const filmingLocations = pgTable(
    'filming_locations',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        locationId: bigint('location_id', { mode: 'bigint' })
            .notNull()
            .references(() => locations.id),
        movieId: bigint('movie_id', { mode: 'number' }).references(
            () => movies.id,
        ),
        seriesId: bigint('series_id', { mode: 'number' }).references(
            () => series.id,
        ),
        description: text('description'),
        ...timestamps,
    },
    (table) => ({
        locationIdIdx: index('filming_locations_location_id_idx').on(
            table.locationId,
        ),
        movieIdIdx: index('filming_locations_movie_id_idx').on(table.movieId),
        seriesIdIdx: index('filming_locations_series_id_idx').on(
            table.seriesId,
        ),
        movieLocationUnique: unique().on(table.movieId, table.locationId),
        seriesLocationUnique: unique().on(table.seriesId, table.locationId),
    }),
)
