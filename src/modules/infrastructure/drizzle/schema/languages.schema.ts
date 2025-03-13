import {
    bigint,
    index,
    integer,
    pgTable,
    primaryKey,
    unique,
    varchar,
} from 'drizzle-orm/pg-core'
import { movies } from './movies.schema'
import { series } from './series.schema'
import { movieLanguageTypeEnum, seriesLanguageTypeEnum } from './enums.schema'
import { relations } from 'drizzle-orm'

export const languages = pgTable(
    'languages',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        name: varchar('name').default(''),
    },
    (table) => ({
        iso: unique('iso_unique_idx'),
        englishNameIndex: index('english_name_index').on(table.englishName),
        nameIndex: index('name_index').on(table.name),
    }),
)

export const movieLanguages = pgTable(
    'movie_languages',
    {
        movieId: bigint('movie_id', { mode: 'bigint' })
            .notNull()
            .references(() => movies.id, { onDelete: 'cascade' }),
        languageId: integer('language_id')
            .notNull()
            .references(() => languages.id, { onDelete: 'cascade' }),
        type: movieLanguageTypeEnum('type').notNull(),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.movieId, table.languageId, table.type],
        }),
        movieIdx: index('movie_languages_movie_idx').on(table.movieId),
        languageIdx: index('movie_languages_language_idx').on(table.languageId),
    }),
)

export const seriesLanguages = pgTable(
    'series_languages',
    {
        seriesId: bigint('series_id', { mode: 'bigint' })
            .notNull()
            .references(() => series.id, { onDelete: 'cascade' }),
        languageId: integer('language_id')
            .notNull()
            .references(() => languages.id, { onDelete: 'cascade' }),
        type: seriesLanguageTypeEnum('type').notNull(),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.seriesId, table.languageId, table.type],
        }),
        seriesIdx: index('series_languages_series_idx').on(table.seriesId),
        languageIdx: index('series_languages_language_idx').on(
            table.languageId,
        ),
    }),
)

export const languagesRelations = relations(languages, ({ many }) => ({
    movies: many(movieLanguages),
    series: many(seriesLanguages),
}))

export const movieLanguagesRelations = relations(movieLanguages, ({ one }) => ({
    language: one(languages, {
        fields: [movieLanguages.languageId],
        references: [languages.id],
    }),
}))

export const seriesLanguagesRelations = relations(
    seriesLanguages,
    ({ one }) => ({
        language: one(languages, {
            fields: [seriesLanguages.languageId],
            references: [languages.id],
        }),
    }),
)

export type DbLanguage = typeof languages.$inferSelect
export type DbMovieLanguage = typeof movieLanguages.$inferSelect
export type DbSeriesLanguage = typeof seriesLanguages.$inferSelect
