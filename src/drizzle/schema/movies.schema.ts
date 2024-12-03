import {
    boolean,
    date,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    real,
    text,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'

export const movieStatusEnum = pgEnum('movie_status', [
    'Rumored',
    'Planned',
    'In Production',
    'Post Production',
    'Released',
    'Canceled',
])
export const movies = pgTable(
    'movies',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        tmdbId: integer('tmdb_id').notNull().unique(),
        imdbId: text('imdb_id').notNull().unique(),
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
        status: movieStatusEnum().notNull(),
        tagLine: text('tag_line'),
        popularity: real('popularity').default(0), // TODO create ratings table
        voteAverage: real('vote_average').default(0),
        voteCount: integer('vote_count').default(0),
        ...timestamps,
    },
    (table) => ({
        titleIdx: index('movies_title_idx').on(table.title),
        popularityRatingIdx: index('movies_popularity_rating_idx').on(
            table.popularity,
            table.voteAverage,
        ),
        releaseDateIdx: index('movies_release_date_idx').on(table.releaseDate),
        statusIdx: index('movies_status_idx').on(table.status),
        originalLanguageIdx: index('movies_original_language_idx').on(
            table.originalLanguage,
        ),
    }),
)
