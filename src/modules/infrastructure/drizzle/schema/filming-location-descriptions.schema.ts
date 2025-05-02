import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '../helpers/column.helpers'
import { filmingLocations } from './filming-locations.schema'
import { languages } from './languages.schema'

export const filmingLocationDescriptions = pgTable(
    'filming_location_descriptions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        filmingLocationId: uuid('filming_location_id')
            .notNull()
            .references(() => filmingLocations.id, {
                onDelete: 'cascade',
            }),
        languageId: uuid('language_id')
            .notNull()
            .references(() => languages.id, {
                onDelete: 'cascade',
            }),
        description: text('description').notNull(),
        ...timestamps,
    },
)

export const filmingLocationDescriptionsRelations = relations(
    filmingLocationDescriptions,
    ({ one }) => ({
        filmingLocation: one(filmingLocations, {
            fields: [filmingLocationDescriptions.filmingLocationId],
            references: [filmingLocations.id],
        }),
        language: one(languages, {
            fields: [filmingLocationDescriptions.languageId],
            references: [languages.id],
        }),
    }),
)

export type DbFilmingLocationDescription =
    typeof filmingLocationDescriptions.$inferSelect
export type DbFilmingLocationDescriptionInsert =
    typeof filmingLocationDescriptions.$inferInsert
