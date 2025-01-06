import { GenreService, LanguageService } from '../services'
import { LocationsService } from '@/modules/locations/services/locations.service'
import { TitleMappingContext } from '../types/mapping.type'
import { Title } from '../types/title.type'
import {
    ProductionCompany,
    ProductionCountry,
    SimplePerson,
} from '../models/common.model'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import {
    Genre as TmdbGenre,
    Network as TmdbNetwork,
    SimplePerson as TmdbSimplePerson,
} from 'moviedb-promise'
import { bigIntSerializer } from '../services/utils/json.utils'
import { Genre } from '../models/genre.model'

@Injectable()
export abstract class BaseMapper {
    constructor(
        //TODO
        @Inject(forwardRef(() => GenreService))
        protected readonly genreService: GenreService,
        @Inject(forwardRef(() => LanguageService))
        protected readonly languageService: LanguageService,
        @Inject(forwardRef(() => LocationsService))
        protected readonly locationsService: LocationsService,
    ) {}

    protected async mapRelations<T extends Title>(
        entity: T,
        context: TitleMappingContext,
    ): Promise<T> {
        if (!context.includeRelations) return entity

        const [filmingLocations, genres, languages] = await Promise.all([
            this.mapLocations(entity),
            this.mapGenres(entity),
            this.mapLanguages(entity),
        ])

        console.log(bigIntSerializer.stringify(entity))

        return {
            ...entity,
            genres,
            languages,
            filmingLocations,
        }
    }

    protected async mapGenres(entity: Title) {
        if (!entity.imdbId) return []
        return await this.genreService.getGenresForTitle(entity.imdbId)
    }

    protected async mapLanguages(entity: Title) {
        if (!entity.imdbId) return null
        return await this.languageService.getLanguagesForTitle(entity.imdbId)
    }

    protected async mapLocations(entity: Title) {
        if (!entity.imdbId) return []
        return await this.locationsService.getLocationsForTitle(entity.imdbId)
    }

    protected mapTmdbGenres(genres?: TmdbGenre[]): Genre[] {
        if (!genres) return []
        return genres.map((genre) => ({
            tmdbId: String(genre.id || 0),
            names: { en: '', ru: genre.name },
        }))
    }

    protected mapTmdbProductionCompanies(
        companies?: any[],
    ): ProductionCompany[] {
        if (!companies) return []
        return companies.map((company) => ({
            id: company.id || 0,
            name: company.name || '',
            logo_path: company.logo_path,
            origin_country: company.origin_country || '',
        }))
    }

    protected mapTmdbProductionCountries(
        countries?: any[],
    ): ProductionCountry[] {
        if (!countries) return []
        return countries.map((country) => ({
            iso_3166_1: country.iso_3166_1 || '',
            name: country.name || '',
        }))
    }

    protected mapTmdbCreatedBy(people?: TmdbSimplePerson[]): SimplePerson[] {
        if (!people) return []
        return people.map((person) => ({
            id: person.id || 0,
            credit_id: person.credit_id || '',
            name: person.name || '',
            gender: person.gender || 0,
            profile_path: person.profile_path,
        }))
    }

    protected mapTmdbNetworks(networks?: TmdbNetwork[]): SimplePerson[] {
        if (!networks) return []
        return networks.map((network) => ({
            id: network.id || 0,
            name: network.name || '',
            logo_path: network.logo_path,
            origin_country: network.origin_country || '',
        }))
    }
}
