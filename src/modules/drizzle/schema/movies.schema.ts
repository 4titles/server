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
import { movieStatusEnum, titleCategoryEnum } from './enums.schema'
import {
    ProductionCompany,
    ProductionCountry,
} from '@/modules/titles/models/common.model'
import { MovieStatus } from '@/modules/titles/enums/movie-status.enum'
import { TitleCategory } from '@/modules/titles/enums/title-category.enum'
import { movieGenres } from './genres.schema'
import { movieLanguages } from './languages.schema'

export const movies = pgTable(
    'movies',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        tmdbId: bigint('tmdb_id', { mode: 'number' }).notNull().unique(),
        imdbId: text('imdb_id'),
        adult: boolean('adult').notNull().default(false),
        title: text('title').notNull(),
        posterPath: text('poster_path'), // TODO posters table
        backdropPath: text('backdrop_path'), // TODO posters table
        budget: integer('budget').default(0),
        homepage: text('homepage'),
        originCountry: jsonb('origin_country').$type<string[]>().notNull(), // TODO create countries table
        originalTitle: text('original_title').notNull(),
        overview: text('overview').notNull(),
        productionCompanies: jsonb('production_companies')
            .$type<ProductionCompany[]>()
            .notNull(), // TODO create production_companies table
        productionCountries: jsonb('production_countries')
            .$type<ProductionCountry[]>()
            .notNull(), // TODO create countries table
        releaseDate: date('release_date'),
        revenue: integer('revenue').default(0),
        runtime: integer('runtime').default(0),
        status: movieStatusEnum('status').$type<MovieStatus>().notNull(),
        tagLine: text('tag_line'),
        popularity: real('popularity').default(0), // TODO create ratings table
        voteAverage: real('vote_average').default(0),
        voteCount: integer('vote_count').default(0),
        category: titleCategoryEnum('category')
            .$type<TitleCategory>()
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        titleIdx: index('movies_title_idx').on(table.title),
        imdbIdUnique: sql`CREATE UNIQUE INDEX IF NOT EXISTS "movies_imdb_id_unique" ON "movies" ("imdb_id") WHERE "imdb_id" IS NOT NULL AND "imdb_id" != ''`,
        popularityRatingIdx: index('movies_popularity_rating_idx').on(
            table.popularity,
            table.voteAverage,
        ),
        releaseDateIdx: index('movies_release_date_idx').on(table.releaseDate),
        statusIdx: index('movies_status_idx').on(table.status),
    }),
)

export const moviesRelations = relations(movies, ({ many }) => ({
    filmingLocations: many(filmingLocations),
    genres: many(movieGenres),
    languages: many(movieLanguages),
}))

export type DbMovie = typeof movies.$inferSelect
