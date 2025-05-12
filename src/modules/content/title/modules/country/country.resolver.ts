import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { TmdbCountry } from '../tmdb/models/tmdb-country.model'
import { CountryService } from './country.service'
import { CountryStatisticsInput } from './inputs/country-statistics.input'
import { CreateCountryInput } from './inputs/create-country.input'
import { CountryStatistics } from './models/country-statistics.model'
import { Country } from './models/country.model'

@Resolver(() => Country)
export class CountryResolver {
    constructor(private readonly countryService: CountryService) {}

    @Query(() => Country)
    async findCountryById(@Args('id') id: string): Promise<Country> {
        return await this.countryService.findById(id)
    }

    @Query(() => Country)
    async findCountryByISO(@Args('iso') iso: string): Promise<Country> {
        return await this.countryService.findById(iso)
    }

    @Query(() => Country)
    async findCountryByEnglishName(
        @Args('englishName') englishName: string,
    ): Promise<Country> {
        return await this.countryService.findByEnglishName(englishName)
    }

    @Query(() => Country)
    async findCountryByName(@Args('name') name: string): Promise<Country> {
        return await this.countryService.findByName(name)
    }

    @Query(() => [Country])
    async findAllCountries(): Promise<Country[]> {
        return await this.countryService.findAll()
    }

    @Query(() => [Country])
    async findAllCountriesWithRelations() {
        return await this.countryService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TmdbCountry])
    async getCountriesListFromTmdb(): Promise<TmdbCountry[]> {
        return await this.countryService.getCountriesListFromTmdb()
    }

    @Query(() => [CountryStatistics])
    async getCountriesStatistics(
        @Args('input', { nullable: true }) input?: CountryStatisticsInput,
    ): Promise<CountryStatistics[]> {
        return await this.countryService.getCountriesStatistics(input || {})
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async createCountry(
        @Args('data') input: CreateCountryInput,
    ): Promise<boolean> {
        return await this.countryService.create(input)
    }
}
