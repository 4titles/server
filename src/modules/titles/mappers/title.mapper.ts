import { FilmingLocationMapper } from '@/modules/locations/mappers/filming-location.mapper'
import { bigIntSerializer } from '../services/utils/json.utils'
import { DbTitle, Title } from '../types/title.type'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { Inject } from '@nestjs/common'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { eq } from 'drizzle-orm'
import { genres } from '@/modules/drizzle/schema/genres.schema'
import { Genre } from '../models/genre.model'
import { SimplePerson, Network as TmdbNetwork } from 'moviedb-promise'
import {
    Network,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
} from '../models/common.model'
import { GenreMapper } from './genre.mapper'
// import { MovieLanguage, SeriesLanguage } from '../models/language.model'

export class TitleMapper {
    constructor(@Inject(DRIZZLE) protected db: DrizzleDB) {}

    // async onModuleInit() {
    //     this.languageService = this.moduleRef.get(LanguageService, {
    //         strict: false,
    //     })
    // }

    async mapSingleWithRelations<T extends Title>(
        title: DbTitle | null,
    ): Promise<T | null> {
        if (!title) return null

        const serialized = JSON.parse(bigIntSerializer.stringify(title))

        return {
            ...serialized,
            filmingLocations: this.mapFilmingLocations(
                serialized.filmingLocations,
            ),
            genres: await this.mapGenres(serialized.genres),
            // languages: await this.mapLanguages(serialized.id),
        } as T
    }

    async mapManyWithRelations<T extends Title>(
        titles: DbTitle[],
    ): Promise<T[]> {
        const serialized = JSON.parse(bigIntSerializer.stringify(titles))

        return serialized.map(async (title: T) => ({
            ...title,
            filmingLocations: this.mapFilmingLocations(title.filmingLocations),
            genres: await this.mapGenres(title.genres),
            // languages: await this.mapLanguages(serialized.id),
        })) as T[]
    }

    protected mapFilmingLocations(
        filmingLocations?: FilmingLocation[],
    ): FilmingLocation[] {
        return filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(filmingLocations)
            : []
    }

    async mapGenres(genresToMap: Partial<Genre>[]): Promise<Genre[]> {
        const mappedGenres = await Promise.all(
            genresToMap.map(async (genre: any) => {
                if (!genre) return

                let genreItem: any = genre as any
                if (genreItem?.genre) genreItem = genre?.genre

                let dbGenre = await this.db.query.genres.findFirst({
                    where: eq(genres.tmdbId, BigInt(genreItem.tmdbId)),
                })

                if (!dbGenre) {
                    await this.db
                        .insert(genres)
                        .values({
                            tmdbId: BigInt(genreItem.tmdbId),
                            names: {
                                en: genreItem.names.en ?? '',
                                ru: genreItem.names.ru ?? '',
                            },
                        })
                        .onConflictDoNothing()
                    dbGenre = await this.db.query.genres.findFirst({
                        where: eq(genres.tmdbId, BigInt(genreItem.tmdbId)),
                    })
                }

                if (!dbGenre) return null

                return GenreMapper.toGraphQL(dbGenre)
            }),
        )

        return mappedGenres
    }

    // protected async mapLanguages(
    //     imdbId: string,
    // ): Promise<MovieLanguage[] | SeriesLanguage[]> {
    //     try {
    //         return await this.languageService.getLanguagesForTitle(imdbId)
    //     } catch (error) {
    //         console.error(`Failed to map languages for title ${imdbId}:`, error)
    //         return []
    //     }
    // }
    protected mapCreatedBy(people?: SimplePerson[]): SimplePerson[] {
        if (!people) return []
        return people.map((person) => ({
            id: person.id || 0,
            credit_id: person.credit_id || '',
            name: person.name || '',
            gender: person.gender || 0,
            profile_path: person.profile_path,
        }))
    }

    protected mapNetworks(networks?: TmdbNetwork[]): Network[] {
        if (!networks) return []
        return networks.map((network) => ({
            id: network.id || 0,
            name: network.name || '',
            logo_path: network.logo_path,
            origin_country: network.origin_country || '',
        }))
    }

    protected mapProductionCompanies(companies?: any[]): ProductionCompany[] {
        if (!companies) return []
        return companies.map((company) => ({
            id: company.id || 0,
            name: company.name || '',
            logo_path: company.logo_path,
            origin_country: company.origin_country || '',
        }))
    }

    protected mapProductionCountries(countries?: any[]): ProductionCountry[] {
        if (!countries) return []
        return countries.map((country) => ({
            iso_3166_1: country.iso_3166_1 || '',
            name: country.name || '',
        }))
    }

    protected mapSpokenLanguages(languages?: any[]): SpokenLanguage[] {
        if (!languages) return []
        return languages.map((language) => ({
            english_name: language.english_name || '',
            iso_639_1: language.iso_639_1 || '',
            name: language.name || '',
        }))
    }
}
