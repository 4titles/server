import { DRIZZLE } from '@/modules/infrastructure/drizzle/drizzle.module'
import {
    DbFilmingLocation,
    filmingLocations,
} from '@/modules/infrastructure/drizzle/schema/filming-locations.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { CountryService } from '../../country/country.service'
import { Country } from '../../country/models/country.model'
import { GeocodingService } from '../../geocoding/geocoding.service'
import { GeocodingResult } from '../../geocoding/models/geocoding-result.model'
import { RawLocation } from '../interfaces/raw-location.interface'

@Injectable()
export class FilmingLocationService {
    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly geocodingService: GeocodingService,
        private readonly countryService: CountryService,
    ) {}

    async findByPlaceId(placeId: string): Promise<DbFilmingLocation | null> {
        return await this.db.query.filmingLocations.findFirst({
            where: eq(filmingLocations.placeId, placeId),
            with: { country: true },
        })
    }

    async findByAddress(address: string): Promise<DbFilmingLocation | null> {
        return await this.db.query.filmingLocations.findFirst({
            where: eq(filmingLocations.address, address),
            with: { country: true },
        })
    }

    async geocodeLocationsByAddress(
        address: string,
    ): Promise<GeocodingResult[] | null> {
        const geocodedLocations =
            await this.geocodingService.geocodeAddress(address)

        if (geocodedLocations.length > 0) {
            return geocodedLocations
        }

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
            enhancedDescription: '', // TODO
            userId,
            isVerified: true,
            verifiedAt: new Date(),
            lastVerifiedAt: new Date(),
        }

        await this.db.insert(filmingLocations).values(newLocation)

        return true
    }

    async verifyLocation(
        locationId: string,
        userId: string,
        enhancedDescription?: string,
    ): Promise<void> {
        const locationUpdate: Partial<DbFilmingLocation> = {
            isVerified: true,
            verifiedAt: new Date(),
            enhancedDescription,
            userId,
            updatedAt: new Date(),
        }

        await this.db
            .update(filmingLocations)
            .set(locationUpdate)
            .where(eq(filmingLocations.id, locationId))
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
}
