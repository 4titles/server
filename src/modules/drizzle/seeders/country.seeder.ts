import { Inject, Injectable, Logger } from '@nestjs/common'
import { TmdbService } from '../../tmdb/tmdb.service'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DrizzleDB } from '../types/drizzle'
import { countries } from '../schema/countries.schema'
import { TmdbCountry } from '@/modules/tmdb/types/country.type'

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

            await this.db.delete(countries)

            const countriesToInsert = tmdbCountries.map((c) => ({
                englishName: c.english_name,
                iso: c.iso_3166_1,
                nativeName: c?.native_name,
            }))

            await this.db.insert(countries).values(countriesToInsert)

            this.logger.log(
                `Successfully seeded ${tmdbCountries.length} countries`,
            )
        } catch (error) {
            this.logger.error('Failed to seed countries:', error)
            throw error
        }
    }
}
