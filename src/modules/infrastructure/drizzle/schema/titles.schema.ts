import { TitleCategory } from '@/modules/content/titles/enums/title-category.enum'
import { TitleStatus } from '@/modules/content/titles/enums/title-status.enum'
import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    integer,
    pgTable,
    real,
    text,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'

import { comments } from './comments.schema'
import {
    titleCategoryEnum,
    titleStatusEnum,
    titleTypeEnum,
} from './enums.schema'
import { movieDetails } from './movie-details.schema'
import { seriesDetails } from './series-details.schema'
import { titleCountries } from './title-countries.schema'
import { titleFilmingLocations } from './title-filming-locations.schema'
import { titleGenres } from './title-genres.schema'
import { titleLanguages } from './title-languages.schema'
import { titleNetworks } from './title-networks.schema'
import { titleProductionCompanies } from './title-production-companies.schema'

export const titles = pgTable(
    'titles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: text('name').notNull(),
        originalName: text('original_name'),
        type: titleTypeEnum('type').notNull(),
        tmdbId: text('tmdb_id').notNull().unique(),
        imdbId: text('imdb_id').unique(),
        adult: boolean('adult').notNull().default(false),
        posterPath: text('poster_path'),
        backdropPath: text('backdrop_path'),
        homepage: text('homepage'),
        overview: text('overview').notNull(),
        popularity: real('popularity').default(0),
        voteAverage: real('vote_average').default(0),
        voteCount: integer('vote_count').default(0),
        category: titleCategoryEnum('category')
            .$type<TitleCategory>()
            .notNull(),
        tagLine: text('tag_line'),
        status: titleStatusEnum('status').$type<TitleStatus>().notNull(),
        ...timestamps,
    },
    (table) => ({
        typeIdx: index('titles_type_idx').on(table.type),
        nameIdx: index('titles_name_idx').on(table.name),
        tmdbIdIdx: index('titles_tmdb_id_idx').on(table.tmdbId),
        imdbIdIdx: index('titles_imdb_id_idx').on(table.imdbId),
        categoryIdx: index('titles_category_idx').on(table.category),
        statusIdx: index('titles_status_idx').on(table.status),
        popularityIdx: index('titles_popularity_idx').on(table.popularity),
    }),
)

export const titleRelations = relations(titles, ({ one, many }) => ({
    movieDetails: one(movieDetails, {
        fields: [titles.id],
        references: [movieDetails.titleId],
    }),
    seriesDetails: one(seriesDetails, {
        fields: [titles.id],
        references: [seriesDetails.titleId],
    }),
    filmingLocations: many(titleFilmingLocations),
    genres: many(titleGenres),
    languages: many(titleLanguages),
    productionCompanies: many(titleProductionCompanies),
    countries: many(titleCountries),
    networks: many(titleNetworks),
    comments: many(comments),
}))

export type DbTitle = typeof titles.$inferSelect
export type DbTitleInsert = typeof titles.$inferInsert
