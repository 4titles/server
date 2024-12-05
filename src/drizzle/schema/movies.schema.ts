import {
    bigint,
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
import {
    Genre,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
} from 'src/titles/models/common.model'
import { MovieStatus } from 'src/titles/enums/movie-status.enum'
import { TitleCategory } from 'src/titles/enums/title-category.enum'

export const movieStatusEnum = pgEnum('movie_status', [
    'Rumored',
    'Planned',
    'In Production',
    'Post Production',
    'Released',
    'Canceled',
])

export const titleCategoryEnum = pgEnum('title_category', [
    'POPULAR',
    'TOP_RATED',
    'TRENDING',
    'SEARCH',
])

export const movies = pgTable(
    'movies',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        tmdbId: bigint('tmdb_id', { mode: 'number' }).notNull().unique(),
        imdbId: text('imdb_id').notNull().unique(),
        adult: boolean('adult').notNull().default(false),
        title: text('title').notNull(),
        posterPath: text('poster_path'), // TODO posters table
        backdropPath: text('backdrop_path'), // TODO posters table
        budget: integer('budget').default(0),
        genres: jsonb('genres').$type<Genre[]>().notNull(), // TODO create genres table
        homepage: text('homepage'),
        originCountry: jsonb('origin_country').$type<string[]>().notNull(), // TODO create countries table
        originalLanguage: text('original_language').notNull(), // TODO create languages table
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
        spokenLanguages: jsonb('spoken_languages')
            .$type<SpokenLanguage[]>()
            .notNull(), // TODO create languages table
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
