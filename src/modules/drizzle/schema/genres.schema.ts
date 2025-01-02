import { bigint, index, jsonb, pgTable } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { movies } from './movies.schema'
import { series } from './series.schema'
import { relations } from 'drizzle-orm'
import { GenreTranslations } from '@/modules/titles/models/genre.model'

export const genres = pgTable(
    'genres',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        tmdbId: bigint('tmdb_id', { mode: 'bigint' }).notNull().unique(),
        names: jsonb('names').$type<GenreTranslations>().notNull(),
        ...timestamps,
    },
    (table) => ({
        tmdbIdIdx: index('genres_tmdb_id_idx').on(table.tmdbId),
    }),
)

export const movieGenres = pgTable(
    'movie_genres',
    {
        movieId: bigint('movie_id', { mode: 'bigint' })
            .notNull()
            .references(() => movies.id),
        genreId: bigint('genre_id', { mode: 'bigint' })
            .notNull()
            .references(() => genres.id),
    },
    (table) => ({
        pk: index('movie_genres_pkey').on(table.movieId, table.genreId),
        movieIdIdx: index('movie_genres_movie_id_idx').on(table.movieId),
        genreIdIdx: index('movie_genres_genre_id_idx').on(table.genreId),
    }),
)

export const seriesGenres = pgTable(
    'series_genres',
    {
        seriesId: bigint('series_id', { mode: 'bigint' })
            .notNull()
            .references(() => series.id),
        genreId: bigint('genre_id', { mode: 'bigint' })
            .notNull()
            .references(() => genres.id),
    },
    (table) => ({
        pk: index('series_genres_pkey').on(table.seriesId, table.genreId),
        seriesIdIdx: index('series_genres_series_id_idx').on(table.seriesId),
        genreIdIdx: index('series_genres_genre_id_idx').on(table.genreId),
    }),
)

export const genreRelations = relations(genres, ({ many }) => ({
    movieGenres: many(genres),
    seriesGenres: many(genres),
}))

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
    movie: one(movies, {
        fields: [movieGenres.movieId],
        references: [movies.id],
    }),
    genre: one(genres, {
        fields: [movieGenres.genreId],
        references: [genres.id],
    }),
}))

export const seriesGenresRelations = relations(seriesGenres, ({ one }) => ({
    series: one(series, {
        fields: [seriesGenres.seriesId],
        references: [series.id],
    }),
    genre: one(genres, {
        fields: [seriesGenres.genreId],
        references: [genres.id],
    }),
}))

export type DbGenre = typeof genres.$inferSelect
export type DbMovieGenre = typeof movieGenres.$inferSelect
export type DbSeriesGenre = typeof seriesGenres.$inferSelect
