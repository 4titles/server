import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    countries,
    DbCountry,
} from '@/modules/infrastructure/drizzle/schema/countries.schema'
import { titles } from '@/modules/infrastructure/drizzle/schema/titles.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { asc, eq, inArray } from 'drizzle-orm'
import { TmdbCountry } from '../tmdb/models/tmdb-country.model'
import { TmdbService } from '../tmdb/tmdb.service'
import { CreateCountryInput } from './inputs/create-country.input'
import { Country } from './models/country.model'

@Injectable()
export class CountryService {
    private readonly logger: Logger = new Logger(CountryService.name)

    constructor(
        private readonly tmdbService: TmdbService,
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
        return await this.db.query.countries.findMany({
            orderBy: [asc(countries.englishName)],
            with: {
                titles: {
                    orderBy: [asc(titles.popularity)],
                },
            },
        })
    }

    async getCountriesListFromTmdb(): Promise<TmdbCountry[]> {
        return await this.tmdbService.getCountries()
    }

    async create(input: CreateCountryInput): Promise<boolean> {
        const { iso, englishName, name } = input

        const newCountry = {
            iso,
            name,
            englishName,
        }

        await this.db.insert(countries).values(newCountry)

        return true
    }

    async upsert(input: CreateCountryInput): Promise<boolean> {
        const { iso, englishName, name } = input

        const country = {
            iso,
            englishName,
            name,
        }

        await this.db
            .insert(countries)
            .values(country)
            .onConflictDoUpdate({
                target: countries.iso,
                set: { name, englishName } as Partial<DbCountry>,
            })

        return true
    }

    async createMany(countriesToCreate: CreateCountryInput[]): Promise<number> {
        const createdCountries = await Promise.all(
            countriesToCreate.map((country) => this.upsert(country)),
        )

        return createdCountries?.length || 0
    }
}
