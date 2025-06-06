import { relations } from 'drizzle-orm'
import {
    bigint,
    boolean,
    index,
    integer,
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
        slug: text('slug').unique(),
        type: titleTypeEnum('type').notNull(),
        category: titleCategoryEnum('category').notNull(),
        status: titleStatusEnum('status').notNull(),
        isAdult: boolean('is_adult').default(false),
        popularity: real('popularity').default(0),
        hasLocations: boolean('has_locations').default(false),
        voteCount: integer('vote_count'),
        voteAverage: real('vote_average'),
        releaseDate: timestamp('release_date'),
        budget: bigint({ mode: 'number' }),
        revenue: bigint({ mode: 'number' }),
        runtime: integer('runtime'),
        lastSyncedAt: timestamp('last_synced_at', {
            withTimezone: true,
        }),
        ...timestamps,
    },
    (table) => ({
        tmdbIdIdx: index('titles_tmdb_id_idx').on(table.tmdbId),
        imdbIdIdx: index('titles_imdb_id_idx').on(table.imdbId),
        slugIdx: index('titles_slug_idx').on(table.slug),
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
    favorites: many(favorites, { relationName: 'title' }),
    favoritesFilmingLocation: many(favorites, {
        relationName: 'filmingLocationTitle',
    }),
    translations: many(titleTranslations),
    images: many(titleImages),
}))

export type DbTitle = typeof titles.$inferSelect
export type DbTitleInsert = typeof titles.$inferInsert
