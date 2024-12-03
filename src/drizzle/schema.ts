import {
    boolean,
    date,
    integer,
    jsonb,
    pgTable,
    real,
    text,
} from 'drizzle-orm/pg-core'
import { timestamps } from './helpers/column.helpers'

export const moviesTable = pgTable('movies', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    tmdbId: integer('tmdb_id').notNull(),
    imdbId: text('imdb_id').notNull(),
    adult: boolean('adult').notNull().default(false),
    title: text('title').notNull(),
    posterPath: text('poster_path'), // TODO posters table
    backdropPath: text('backdrop_path'), // TODO posters table
    budget: integer('budget').default(0),
    genres: jsonb('genres').notNull(), // TODO create genres table
    homepage: text('homepage'),
    originCountry: jsonb('origin_country').notNull(), // TODO create countries table
    originalLanguage: text('original_language').notNull(), // TODO create languages table
    originalTitle: text('original_title').notNull(),
    overview: text('overview').notNull(),
    productionCompanies: jsonb('production_companies').notNull(), // TODO create production_companies table
    productionCountries: jsonb('production_countries').notNull(), // TODO create countries table
    releaseDate: date('release_date'),
    revenue: integer('revenue').default(0),
    runtime: integer('runtime').default(0),
    spokenLanguages: jsonb('spoken_languages').notNull(), // TODO create languages table
    status: text('status').notNull(),
    tagLine: text('tag_line'),
    popularity: real('popularity').default(0), // TODO create ratings table
    voteAverage: real('vote_average').default(0),
    voteCount: integer('vote_count').default(0),
    ...timestamps,
})

export const seriesTable = pgTable('series', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    tmdbId: integer('tmdb_id').notNull(),
    imdbId: text('imdb_id').notNull(),
    adult: boolean('adult').notNull().default(false),
    name: text('name').notNull(),
    posterPath: text('poster_path'), // TODO posters table
    backdropPath: text('backdrop_path'), // TODO posters table
    createdBy: jsonb('created_by').notNull(), // TODO create credits table
    episodeRunTime: jsonb('episode_run_time').default([]), // array of integers
    firstAirDate: date('first_air_date'),
    genres: jsonb('genres').notNull(), // TODO create genres table
    homepage: text('homepage'),
    inProduction: boolean('in_production').notNull().default(false),
    languages: jsonb('languages').default([]), // TODO create languages table, array of strings
    lastAirDate: date('last_air_date'),
    networks: jsonb('networks').notNull(), // TODO create networks table
    numberOfEpisodes: integer('number_of_episodes').default(0),
    numberOfSeasons: integer('number_of_seasons').default(0),
    originCountry: jsonb('origin_country').notNull(), // TODO create countries table
    originalLanguage: text('original_language').notNull(), // TODO create languages table
    overview: text('overview').notNull(),
    popularity: real('popularity').default(0), // TODO create ratings table
    productionCompanies: jsonb('production_companies').notNull(), // TODO create production_companies table
    productionCountries: jsonb('production_countries').notNull(), // TODO create countries table
    spokenLanguages: jsonb('spoken_languages').notNull(), // TODO create languages table
    status: text('status').notNull(),
    tagLine: text('tag_line'),
    voteAverage: real('vote_average').default(0),
    voteCount: integer('vote_count').default(0),
    ...timestamps,
})
