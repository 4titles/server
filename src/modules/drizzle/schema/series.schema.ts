import {
    bigint,
    boolean,
    date,
    index,
    integer,
    jsonb,
    pgTable,
    real,
    text,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { relations, sql } from 'drizzle-orm'
import { filmingLocations } from './filming-locations.schema'
import { titleCategoryEnum } from './enums.schema'
import {
    Network,
    ProductionCompany,
    ProductionCountry,
} from '@/modules/titles/models/common.model'
import { SimplePerson } from '@/modules/titles/models/common.model'
import { TitleCategory } from '@/modules/titles/enums/title-category.enum'
import { seriesGenres } from './genres.schema'
import { seriesLanguages } from './languages.schema'

export const series = pgTable(
    'series',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        tmdbId: bigint('tmdb_id', { mode: 'number' }).notNull().unique(),
        imdbId: text('imdb_id'),
        adult: boolean('adult').notNull().default(false),
        name: text('name').notNull(),
        posterPath: text('poster_path'), // TODO posters table
        backdropPath: text('backdrop_path'), // TODO posters table
        createdBy: jsonb('created_by').$type<SimplePerson[]>().notNull(), // TODO create credits table
        episodeRunTime: jsonb('episode_run_time').$type<number[]>().default([]), // array of integers
        firstAirDate: date('first_air_date'),
        homepage: text('homepage'),
        inProduction: boolean('in_production').notNull().default(false),
        lastAirDate: date('last_air_date'),
        networks: jsonb('networks').$type<Network[]>().notNull(), // TODO create networks table
        numberOfEpisodes: integer('number_of_episodes').default(0),
        numberOfSeasons: integer('number_of_seasons').default(0),
        originCountry: jsonb('origin_country').$type<string[]>().notNull(), // TODO create countries table
        originalName: text('original_name'),
        overview: text('overview').notNull(),
        popularity: real('popularity').default(0), // TODO create ratings table
        productionCompanies: jsonb('production_companies')
            .$type<ProductionCompany[]>()
            .notNull(), // TODO create production_companies table
        productionCountries: jsonb('production_countries')
            .$type<ProductionCountry[]>()
            .notNull(), // TODO create countries table
        status: text('status').notNull(),
        tagLine: text('tag_line'),
        voteAverage: real('vote_average').default(0),
        voteCount: integer('vote_count').default(0),
        category: titleCategoryEnum('category')
            .$type<TitleCategory>()
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        titleIdx: index('series_title_idx').on(table.name),
        imdbIdUnique: sql`CREATE UNIQUE INDEX IF NOT EXISTS "movies_imdb_id_unique" ON "movies" ("imdb_id") WHERE "imdb_id" IS NOT NULL AND "imdb_id" != ''`,
        popularityRatingIdx: index('series_popularity_rating_idx').on(
            table.popularity,
            table.voteAverage,
        ),
        firstAirDateIdx: index('series_first_air_date_idx').on(
            table.firstAirDate,
        ),
        lastAirDateIdx: index('series_last_air_date_idx').on(table.lastAirDate),
        statusProductionIdx: index('series_status_production_idx').on(
            table.status,
            table.inProduction,
        ),
    }),
)

export const seriesRelations = relations(series, ({ many }) => ({
    filmingLocations: many(filmingLocations),
    genres: many(seriesGenres),
    languages: many(seriesLanguages),
}))

export type DbSeries = typeof series.$inferSelect
