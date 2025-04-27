import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    countries,
    DbCountry,
} from '@/modules/infrastructure/drizzle/schema/countries.schema'
import { filmingLocations } from '@/modules/infrastructure/drizzle/schema/filming-locations.schema'
import { titleCountries } from '@/modules/infrastructure/drizzle/schema/title-countries.schema'
import { titles } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, asc, count, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { TitleType } from '../../enums/title-type.enum'
import { TmdbCountry } from '../tmdb/models/tmdb-country.model'
import { TmdbService } from '../tmdb/tmdb.service'
import { CountryFlagService } from './country-flag.service'
import { CountryRelation } from './enums/country-relation.enum'
import { CountryStatisticsInput } from './inputs/country-statistics.input'
import { CreateCountryInput } from './inputs/create-country.input'
import { CountryStatistics } from './models/country-statistics.model'
import { Country } from './models/country.model'

@Injectable()
export class CountryService {
    private readonly logger: Logger = new Logger(CountryService.name)
    private readonly STATISTICS_CACHE_KEY = 'country:statistics'
    private readonly STATISTICS_CACHE_TTL = 3600 // 1 hour

    constructor(
        private readonly tmdbService: TmdbService,
        private readonly countryFlagService: CountryFlagService,
        private readonly cacheService: CacheService,
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
    ) {}

    async findById(id: string): Promise<Country> {
        return await this.db.query.countries.findFirst({
            where: eq(countries.id, id),
        })
    }

    async findByISO(iso: string): Promise<Country> {
        return await this.db.query.countries.findFirst({
            where: eq(countries.iso, iso),
        })
    }

    async findByEnglishName(englishName: string): Promise<Country> {
        return await this.db.query.countries.findFirst({
            where: eq(countries.englishName, englishName),
        })
    }

    async findByName(name: string): Promise<Country> {
        return await this.db.query.countries.findFirst({
            where: eq(countries.name, name),
        })
    }

    async findManyByISO(iso: string[]): Promise<Country[]> {
        return await this.db.query.countries.findMany({
            where: inArray(countries.iso, iso),
        })
    }

    async findAll(): Promise<Country[]> {
        return await this.db.query.countries.findMany({
            orderBy: [asc(countries.englishName)],
            with: {},
        })
    }

    async findAllWithRelations() {
        const result = await this.db
            .select({
                country: countries,
                filmingLocation: filmingLocations,
                titleCountry: titleCountries,
                title: titles,
            })
            .from(countries)
            .leftJoin(
                filmingLocations,
                eq(countries.id, filmingLocations.countryId),
            )
            .leftJoin(
                titleCountries,
                eq(countries.id, titleCountries.countryId),
            )
            .leftJoin(titles, eq(titleCountries.titleId, titles.id))
            .orderBy(
                desc(
                    sql`(SELECT COUNT(*) FROM ${filmingLocations} WHERE ${filmingLocations.countryId} = ${countries.id})`,
                ),
            )
            .execute()

        const grouped = result.reduce((acc, row) => {
            if (!acc[row.country.id]) {
                acc[row.country.id] = {
                    ...row.country,
                    titles: [],
                    filmingLocations: [],
                }
            }
            if (
                row.title &&
                !acc[row.country.id].titles.some((t) => t.id === row.title.id)
            ) {
                acc[row.country.id].titles.push({
                    ...row.titleCountry,
                    title: row.title,
                })
            }
            if (
                row.filmingLocation &&
                !acc[row.country.id].filmingLocations.some(
                    (fl) => fl.id === row.filmingLocation.id,
                )
            ) {
                acc[row.country.id].filmingLocations.push(row.filmingLocation)
            }
            return acc
        }, {})

        return Object.values(grouped)
    }

    async getCountriesListFromTmdb(): Promise<TmdbCountry[]> {
        return await this.tmdbService.getCountries()
    }

    async enrichCountriesWithFlags(
        countriesToEnrich: CreateCountryInput[],
    ): Promise<CreateCountryInput[]> {
        const isoCodes = countriesToEnrich.map((country) => country.iso)
        const flagUrls =
            await this.countryFlagService.getFlagUrlsForCountries(isoCodes)

        return countriesToEnrich.map((country) => ({
            ...country,
            flagUrl: flagUrls[country.iso] || undefined,
        }))
    }

    async create(input: CreateCountryInput): Promise<boolean> {
        const { iso, englishName, name, flagUrl } = input

        const newCountry = {
            iso,
            name,
            englishName,
            flagUrl,
        }

        await this.db.insert(countries).values(newCountry)

        return true
    }

    async upsert(input: CreateCountryInput): Promise<boolean> {
        const { iso, englishName, name, flagUrl } = input

        const country = {
            iso,
            englishName,
            name,
            flagUrl,
        }

        await this.db
            .insert(countries)
            .values(country)
            .onConflictDoUpdate({
                target: countries.iso,
                set: { name, englishName, flagUrl } as Partial<DbCountry>,
            })

        return true
    }

    async createMany(countriesToCreate: CreateCountryInput[]): Promise<number> {
        const enrichedCountries =
            await this.enrichCountriesWithFlags(countriesToCreate)

        const createdCountries = await Promise.all(
            enrichedCountries.map((country) => this.upsert(country)),
        )

        return createdCountries?.length || 0
    }

    async getCountriesStatistics(
        input: CountryStatisticsInput,
    ): Promise<CountryStatistics[]> {
        const { limit = 20, withFilmingLocationsOnly = true } = input
        const cacheKey = `${this.STATISTICS_CACHE_KEY}:${limit}:${withFilmingLocationsOnly}`

        try {
            const cachedData =
                await this.cacheService.get<CountryStatistics[]>(cacheKey)
            if (cachedData) {
                this.logger.log(
                    `Retrieved countries statistics from cache with key: ${cacheKey}`,
                )
                return cachedData
            }
        } catch (error) {
            this.logger.error(
                `Error retrieving from cache: ${error.message}`,
                error.stack,
            )
        }

        const movieCountSubquery = this.db
            .select({
                countryId: titleCountries.countryId,
                count: count().as('movieCount'),
            })
            .from(titleCountries)
            .innerJoin(
                titles,
                and(
                    eq(titleCountries.titleId, titles.id),
                    eq(titleCountries.type, CountryRelation.PRODUCTION),
                ),
            )
            .where(eq(titles.type, TitleType.MOVIE))
            .groupBy(titleCountries.countryId)
            .as('movieCount')

        const seriesCountSubquery = this.db
            .select({
                countryId: titleCountries.countryId,
                count: count().as('seriesCount'),
            })
            .from(titleCountries)
            .innerJoin(
                titles,
                and(
                    eq(titleCountries.titleId, titles.id),
                    eq(titleCountries.type, CountryRelation.PRODUCTION),
                ),
            )
            .where(eq(titles.type, TitleType.TV))
            .groupBy(titleCountries.countryId)
            .as('seriesCount')

        const locationsCountSubquery = this.db
            .select({
                countryId: filmingLocations.countryId,
                count: count().as('locationsCount'),
            })
            .from(filmingLocations)
            .groupBy(filmingLocations.countryId)
            .as('locationsCount')

        const result = await this.db
            .select({
                id: countries.id,
                iso: countries.iso,
                englishName: countries.englishName,
                name: countries.name,
                flagUrl: countries.flagUrl,
                moviesCount: sql<number>`COALESCE(${movieCountSubquery.count}, 0)`,
                seriesCount: sql<number>`COALESCE(${seriesCountSubquery.count}, 0)`,
                locationsCount: sql<number>`COALESCE(${locationsCountSubquery.count}, 0)`,
            })
            .from(countries)
            .leftJoin(
                movieCountSubquery,
                eq(countries.id, movieCountSubquery.countryId),
            )
            .leftJoin(
                seriesCountSubquery,
                eq(countries.id, seriesCountSubquery.countryId),
            )
            .leftJoin(
                locationsCountSubquery,
                eq(countries.id, locationsCountSubquery.countryId),
            )
            .where(
                withFilmingLocationsOnly
                    ? isNotNull(locationsCountSubquery.countryId)
                    : undefined,
            )
            .orderBy(
                desc(sql<number>`COALESCE(${locationsCountSubquery.count}, 0)`),
                desc(
                    sql<number>`COALESCE(${movieCountSubquery.count}, 0) + 
                              COALESCE(${seriesCountSubquery.count}, 0)`,
                ),
            )
            .limit(limit)
            .execute()

        try {
            await this.cacheService.set(
                cacheKey,
                result,
                this.STATISTICS_CACHE_TTL,
            )
            this.logger.log(`Cached countries statistics with key: ${cacheKey}`)
        } catch (error) {
            this.logger.error(
                `Error caching data: ${error.message}`,
                error.stack,
            )
        }

        return result
    }
}
