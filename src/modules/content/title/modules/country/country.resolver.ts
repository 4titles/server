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

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Country, { name: 'findCountryById' })
    async findById(@Args('id') id: string): Promise<Country> {
        return await this.countryService.findById(id)
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Country, { name: 'findCountryByISO' })
    async findByISO(@Args('iso') iso: string): Promise<Country> {
        return await this.countryService.findById(iso)
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Country, { name: 'findCountryByEnglishName' })
    async findByEnglishName(
        @Args('englishName') englishName: string,
    ): Promise<Country> {
        return await this.countryService.findByEnglishName(englishName)
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => Country, { name: 'findCountryByName' })
    async findByName(@Args('name') name: string): Promise<Country> {
        return await this.countryService.findByName(name)
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Country], { name: 'findAllCountries' })
    async findAll(): Promise<Country[]> {
        return await this.countryService.findAll()
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [Country], { name: 'findAllCountriesWithRelations' })
    async findAllWithRelations() {
        return await this.countryService.findAllWithRelations()
    }

    @RbacProtected({
        resource: Resource.TMDB,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [TmdbCountry], { name: 'getCountriesListFromTmdb' })
    async getListFromTmdb(): Promise<TmdbCountry[]> {
        return await this.countryService.getCountriesListFromTmdb()
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean, { name: 'createCountry' })
    async create(@Args('data') input: CreateCountryInput): Promise<boolean> {
        return await this.countryService.create(input)
    }

    @RbacProtected({
        resource: Resource.COUNTRY,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [CountryStatistics], { name: 'getCountriesStatistics' })
    async getCountriesStatistics(
        @Args('input', { nullable: true }) input?: CountryStatisticsInput,
    ): Promise<CountryStatistics[]> {
        return await this.countryService.getCountriesStatistics(input || {})
    }
}
