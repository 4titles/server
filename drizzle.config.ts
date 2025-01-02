import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/modules/drizzle/schema/**.schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
})
