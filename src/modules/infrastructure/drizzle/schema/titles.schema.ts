import { TitleDetails } from '@/modules/content/title/models/title.model'
import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { comments } from './comments.schema'
import {
    titleCategoryEnum,
    titleStatusEnum,
    titleTypeEnum,
} from './enums.schema'
import { favorites } from './favorites.schema'
import { titleCountries } from './title-countries.schema'
import { titleFilmingLocations } from './title-filming-locations.schema'
import { titleGenres } from './title-genres.schema'
import { titleImages } from './title-images.schema'
import { titleLanguages } from './title-languages.schema'
import { titleTranslations } from './title-translations.schema'

export const titles = pgTable(
    'titles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tmdbId: text('tmdb_id').notNull().unique(),
        imdbId: text('imdb_id').unique(),
        originalName: text('original_name'),
        type: titleTypeEnum('type').notNull(),
        category: titleCategoryEnum('category').notNull(),
        status: titleStatusEnum('status').notNull(),
        isAdult: boolean('is_adult').default(false),
        posterPath: text('poster_path'),
        backdropPath: text('backdrop_path'),
        popularity: real('popularity').default(0),
        hasLocations: boolean('has_locations').default(false),
        voteCount: integer('vote_count'),
        voteAverage: real('vote_average'),
        releaseDate: timestamp('release_date'),
        details: jsonb('details').$type<TitleDetails>(),
        lastSyncedAt: timestamp('last_synced_at', {
            withTimezone: true,
        }),
        ...timestamps,
    },
    (table) => ({
        tmdbIdIdx: index('titles_tmdb_id_idx').on(table.tmdbId),
        imdbIdIdx: index('titles_imdb_id_idx').on(table.imdbId),
        categoryIdx: index('titles_category_idx').on(table.category),
        popularityIdx: index('titles_popularity_idx').on(table.popularity),
    }),
)

export const titleRelations = relations(titles, ({ many }) => ({
    filmingLocations: many(titleFilmingLocations),
    genres: many(titleGenres),
    languages: many(titleLanguages),
    countries: many(titleCountries),
    comments: many(comments),
    favorites: many(favorites),
    translations: many(titleTranslations),
    images: many(titleImages),
}))

export type DbTitle = typeof titles.$inferSelect
export type DbTitleInsert = typeof titles.$inferInsert
