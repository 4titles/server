import { TmdbService } from '@/modules/tmdb/tmdb.service'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { DrizzleDB } from '../types/drizzle'
import { DRIZZLE } from '../drizzle.module'
import { Language } from 'moviedb-promise'
import { languages } from '../schema/languages.schema'
import { sql } from 'drizzle-orm'

@Injectable()
export class LanguageSeeder {
    private readonly logger: Logger = new Logger(LanguageSeeder.name)

    constructor(
        private readonly tmdbService: TmdbService,
        @Inject(DRIZZLE) protected db: DrizzleDB,
    ) {}

    async seed() {
        try {
            const tmdbLanguages: Language[] =
                await this.tmdbService.getLanguages()

            this.logger.log(
                `Fetched languages: ${JSON.stringify(tmdbLanguages)}`,
            )

            const languagesToInsert = tmdbLanguages.map((l) => ({
                englishName: l.english_name,
                iso: l.iso_639_1,
                name: l.name,
            }))

            await this.db
                .insert(languages)
                .values(languagesToInsert)
                .onConflictDoUpdate({
                    target: languages.id,
                    set: {
                        englishName: sql`EXCLUDED.english_name`,
                        iso: sql`EXCLUDED.iso`,
                    },
                })

            this.logger.log(
                `Successfully seeded ${languagesToInsert.length} countries`,
            )
        } catch (error) {
            this.logger.error('Failed to seed genres:', error)
            throw error
        }
    }
}
