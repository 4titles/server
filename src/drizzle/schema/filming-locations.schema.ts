import {
    bigint,
    index,
    pgTable,
    point,
    text,
    unique,
} from 'drizzle-orm/pg-core'
import { movies } from './movies.schema'
import { series } from './series.schema'
import { timestamps } from '../helpers/column.helpers'
import { relations } from 'drizzle-orm'

export const locations = pgTable(
    'locations',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        address: text('address').notNull(),
        coordinates: point('coordinates', { mode: 'xy' }),
        formattedAddress: text('formatted_address'),
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
        movieId: bigint('movie_id', { mode: 'bigint' }).references(
            () => movies.id,
        ),
        seriesId: bigint('series_id', { mode: 'bigint' }).references(
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

export const locationsRelations = relations(locations, ({ many }) => ({
    filmingLocations: many(filmingLocations),
}))

export const filmingLocationsRelations = relations(
    filmingLocations,
    ({ one }) => ({
        location: one(locations, {
            fields: [filmingLocations.locationId],
            references: [locations.id],
        }),
        movie: one(movies, {
            fields: [filmingLocations.movieId],
            references: [movies.id],
        }),
        tvShow: one(series, {
            fields: [filmingLocations.seriesId],
            references: [series.id],
        }),
    }),
)
