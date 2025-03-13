import { bigint, pgTable, unique, varchar, index } from 'drizzle-orm/pg-core'

export const countries = pgTable(
    'countries',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        nativeName: varchar('native_name').notNull(),
    },
    (table) => ({
        iso: unique('iso_unique_idx'),
        englishNameIndex: index('english_name_idx').on(table.englishName),
        nativeNameIndex: index('native_name_idx').on(table.nativeName),
    }),
)
