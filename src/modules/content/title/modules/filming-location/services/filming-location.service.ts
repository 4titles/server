import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFilmingLocation,
    filmingLocations,
} from '@/modules/infrastructure/drizzle/schema/filming-locations.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { and, count, eq, ilike, or, SQL } from 'drizzle-orm'
import { CountryService } from '../../country/country.service'
import { Country } from '../../country/models/country.model'
import { GeocodingService } from '../../geocoding/geocoding.service'
import { GeocodingResult } from '../../geocoding/models/geocoding-result.model'
import { FindFilmingLocationsInput } from '../inputs/find-filming-locations.input'
import { RawLocation } from '../interfaces/raw-location.interface'
import { FilmingLocation } from '../models/filming-location.model'

@Injectable()
export class FilmingLocationService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly geocodingService: GeocodingService,
        private readonly countryService: CountryService,
    ) {}

    async findById(id: string): Promise<DbFilmingLocation | null> {
        return await this.db.query.filmingLocations.findFirst({
            where: eq(filmingLocations.id, id),
            with: {
                country: true,
                descriptions: {
                    with: {
                        language: true,
                    },
                },
            },
        })
    }

    async findByPlaceId(placeId: string): Promise<DbFilmingLocation | null> {
        return await this.db.query.filmingLocations.findFirst({
            where: eq(filmingLocations.placeId, placeId),
            with: {
                country: true,
                descriptions: {
                    with: {
                        language: true,
                    },
                },
            },
        })
    }

    async findByAddress(address: string): Promise<DbFilmingLocation | null> {
        return await this.db.query.filmingLocations.findFirst({
            where: eq(filmingLocations.address, address),
            with: {
                country: true,
                descriptions: {
                    with: {
                        language: true,
                    },
                },
            },
        })
    }

    async findFilmingLocations(
        input: FindFilmingLocationsInput,
    ): Promise<FilmingLocation[]> {
        const { take = 10, skip = 0, search } = input

        const conditions: SQL[] = []

        if (search) {
            conditions.push(
                or(
                    ilike(filmingLocations.address, `%${search}%`),
                    ilike(filmingLocations.formattedAddress, `%${search}%`),
                    ilike(filmingLocations.placeId, `%${search}%`),
                    ilike(filmingLocations.city, `%${search}%`),
                    ilike(filmingLocations.state, `%${search}%`),
                    ilike(filmingLocations.description, `%${search}%`),
                ),
            )
        }

        return (await this.db.query.filmingLocations.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            limit: take,
            offset: skip,
            with: {
                country: true,
                descriptions: {
                    with: {
                        language: true,
                    },
                },
                titleFilmingLocations: {
                    with: {
                        filmingLocation: true,
                        title: {
                            with: {
                                translations: {
                                    with: {
                                        language: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })) as unknown as FilmingLocation[]
    }

    async geocodeLocationsByAddress(
        address: string,
    ): Promise<GeocodingResult[] | null> {
        const geocodedLocations =
            await this.geocodingService.geocodeAddress(address)

        if (geocodedLocations.length > 0) return geocodedLocations

        return null
    }

    async createFilmingLocation(
        geocoded: GeocodingResult,
        raw: RawLocation,
        userId?: string,
    ): Promise<boolean> {
        let country: Country
        try {
            country = await this.countryService.findByISO(
                geocoded.countryCode.toUpperCase(),
            )
        } catch (error) {
            console.error(
                `Failed to find country by iso ${geocoded.countryCode}`,
                error.message,
            )
            return false
        }

        const newLocation = {
            address: raw.address,
            coordinates: { x: geocoded.lon, y: geocoded.lat },
            formattedAddress: geocoded.formattedAddress,
            placeId: geocoded.placeId,
            countryId: country.id,
            city: geocoded.city,
            state: geocoded.state,
            description: raw.description,
            userId,
        }

        await this.db.insert(filmingLocations).values(newLocation)

        return true
    }

    async updateLocation(
        locationId: string,
        data: Partial<DbFilmingLocation>,
    ): Promise<void> {
        const locationUpdate: Partial<DbFilmingLocation> = {
            ...data,
            updatedAt: new Date(),
        }

        await this.db
            .update(filmingLocations)
            .set(locationUpdate)
            .where(eq(filmingLocations.id, locationId))
    }

    async getFilmingLocationsCountByUserId(userId: string): Promise<number> {
        return await this.db
            .select({ count: count() })
            .from(filmingLocations)
            .where(eq(filmingLocations.userId, userId))
            .then((res) => res[0]?.count ?? 0)
    }
}
