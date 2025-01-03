import { bigint, index, pgTable, unique, varchar } from 'drizzle-orm/pg-core'

export const languages = pgTable(
    'languages',
    {
        id: bigint('id', { mode: 'bigint' })
            .primaryKey()
            .generatedAlwaysAsIdentity(),
        iso: varchar('iso', { length: 2 }).notNull(),
        englishName: varchar('english_name').notNull(),
        name: varchar('name').default(''),
    },
    (table) => ({
        iso: unique('iso_unique_idx'),
        englishNameIndex: index('english_name_index').on(table.englishName),
        nameIndex: index('name_index').on(table.name),
    }),
)
