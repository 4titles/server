import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Country } from 'src/entities/country.entity'
import { ICountry } from 'src/modules/imdb/interfaces/imdb-graphql.interface'
import { In, Repository } from 'typeorm'

@Injectable()
export class CountryEntityService {
    constructor(
        @InjectRepository(Country)
        private readonly countryRepository: Repository<Country>,
    ) {}

    async findByCountryCodes(countryCodes: string[]): Promise<Country[]> {
        if (!countryCodes?.length) return []

        return this.countryRepository.find({
            where: { code: In(countryCodes) },
        })
    }

    async findOrCreateMany(countries: ICountry[] = []): Promise<Country[]> {
        if (!countries?.length) return []

        const uniqueCountries = Array.from(
            new Map(countries.map((c) => [c.code, c])).values(),
        )

        const existingCountries = await this.findByCountryCodes(
            uniqueCountries.map((c) => c.code),
        )
        const existingCountryMap = new Map(
            existingCountries.map((country) => [country.code, country]),
        )
        const countriesToCreate = uniqueCountries.filter(
            (country) => !existingCountryMap.has(country.code),
        )
        if (!countriesToCreate.length) {
            return existingCountries
        }

        const newCountries = await Promise.all(
            countriesToCreate.map(async (country) => {
                try {
                    return await this.countryRepository.save(
                        this.countryRepository.create({
                            code: country.code,
                            name: country.name,
                        }),
                    )
                } catch {
                    const existing = await this.findByCountryCodes([
                        country.code,
                    ])
                    return existing[0]
                }
            }),
        )

        return [...existingCountries, ...newCountries.filter(Boolean)]
    }

    async updateMany(countries: ICountry[]): Promise<void> {
        if (!countries?.length) return

        const existingCountries = await this.findByCountryCodes(
            countries.map((c) => c.code),
        )

        const updates = existingCountries
            .map((existing) => {
                const newData = countries.find((c) => c.code === existing.code)
                if (newData && newData.name !== existing.name) {
                    existing.name = newData.name
                    return existing
                }
                return null
            })
            .filter(Boolean)

        if (updates.length) {
            await this.countryRepository.save(updates)
        }
    }
}
