import { TmdbCountry } from '@/modules/content/titles/modules/tmdb/types/country.type'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { TmdbService } from '../../../content/titles/modules/tmdb/tmdb.service'
import { countries, DbCountryInsert } from '../schema/countries.schema'
import { DrizzleDB } from '../types/drizzle'

@Injectable()
export class CountrySeeder {
    private readonly logger: Logger = new Logger(CountrySeeder.name)

    constructor(
        private readonly tmdbService: TmdbService,
        @Inject(DRIZZLE) protected db: DrizzleDB,
    ) {}

    async seed() {
        try {
            const tmdbCountries: TmdbCountry[] =
                await this.tmdbService.getCountries()

            this.logger.log(
                `Fetched countries: ${JSON.stringify(tmdbCountries)}`,
            )

            const countriesToInsert: DbCountryInsert[] = tmdbCountries.map(
                (c) => ({
                    englishName: c.english_name,
                    iso: c.iso_3166_1,
                    nativeName: c?.native_name,
                }),
            )

            for (const country of countriesToInsert) {
                const exists = await this.db.query.countries.findFirst({
                    where: eq(countries.iso, country.iso),
                })
                if (!exists) {
                    await this.db.insert(countries).values(country)
                }
            }

            this.logger.log(
                `Successfully seeded ${countriesToInsert.length} countries`,
            )
        } catch (error) {
            this.logger.error('Failed to seed countries:', error)
            throw error
        }
    }
}
