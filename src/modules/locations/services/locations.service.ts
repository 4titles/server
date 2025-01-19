import { CacheService } from '@/modules/cache/cache.service'
import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import {
    filmingLocations,
    locations as locationsSchema,
} from '@/modules/drizzle/schema/filming-locations.schema'
import { DbMovie } from '@/modules/drizzle/schema/movies.schema'
import { DbSeries } from '@/modules/drizzle/schema/series.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { GeocodeResult } from '@/modules/geocoding/interfaces/geocode-result.interface'
import { GeocodingService } from '@/modules/geocoding/services/geocoding.service'
import { TitleType } from '@/modules/titles/enums/title-type.enum'
import { TitlesService } from '@/modules/titles/services'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq, isNull } from 'drizzle-orm'
import { RawLocation } from '../interfaces/raw-location.interface'
import { FilmingLocationMapper } from '../mappers/filming-location.mapper'
import { FilmingLocation } from '../models/filming-location.model'
import { LocationsSyncResult } from '../models/locations-sync-result.model'
import { ImdbParserService } from './imdb-parser.service'

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name)
    private readonly CACHE_TTL = 24 * 60 * 60 * 30 // 30 days

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly cacheService: CacheService,
        private readonly imdbParserService: ImdbParserService,
        @Inject(forwardRef(() => TitlesService))
        private readonly titleService: TitlesService,
        private readonly geocodingService: GeocodingService,
    ) {}

    async getLocationsForTitle(
        imdbId: string,
        isMovie?: boolean,
    ): Promise<FilmingLocation[]> {
        try {
            const { title, type } = await this.titleService.findByImdbId(
                imdbId,
                isMovie,
            )
            const isTypeMovie: boolean = type === TitleType.MOVIES

            const locations = await this.db.query.filmingLocations.findMany({
                where: isTypeMovie
                    ? and(
                          eq(filmingLocations.movieId, title.id),
                          isNull(filmingLocations.seriesId),
                      )
                    : and(
                          eq(filmingLocations.seriesId, title.id),
                          isNull(filmingLocations.movieId),
                      ),
                with: {
                    location: true,
                    movie: isTypeMovie ? true : undefined,
                    tvShow: !isTypeMovie ? true : undefined,
                },
            })

            return FilmingLocationMapper.manyToGraphQL(locations)
        } catch (error) {
            this.logger.error(
                `Error fetching locations for title with imdbId ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async syncAllLocations(): Promise<LocationsSyncResult> {
        try {
            const [movies, series]: [DbMovie[], DbSeries[]] =
                await this.titleService.findAll()

            const imdbIds = [
                ...movies.filter((m) => m.imdbId).map((m) => m.imdbId),
                ...series.filter((s) => s.imdbId).map((s) => s.imdbId),
            ]

            if (!imdbIds.length) {
                return this.createEmptyResult()
            }

            this.logger.log(`Starting full sync for ${imdbIds.length} titles`)
            await this.cacheService.clear()

            return await this.syncLocationsForTitles(imdbIds)
        } catch (error) {
            this.logger.error('Error in syncAllLocations:', error)
            return this.createErrorResult(error.message)
        }
    }

    async syncLocationsForTitles(
        imdbIds: string[],
    ): Promise<LocationsSyncResult> {
        const result = this.createEmptyResult()

        try {
            const locationsMap =
                await this.imdbParserService.batchGetFilmingLocations(imdbIds)

            await Promise.all(
                Array.from(locationsMap.entries()).map(
                    async ([imdbId, locations]) => {
                        try {
                            const success = await this.syncLocations(
                                imdbId,
                                locations,
                            )
                            this.updateSyncResult(result, imdbId, success)
                        } catch (error) {
                            this.handleSyncError(result, imdbId, error)
                        }
                    },
                ),
            )

            this.handleUnprocessedIds(result, imdbIds, locationsMap)
            return result
        } catch (error) {
            return this.createErrorResult(error.message)
        }
    }

    async syncLocationsForTitle(
        imdbId: string,
        isMovie?: boolean,
    ): Promise<boolean> {
        try {
            const locations =
                await this.imdbParserService.getFilmingLocations(imdbId)

            const cacheKey = `locations_${imdbId}`
            await this.cacheService.set(cacheKey, locations, this.CACHE_TTL)

            return await this.syncLocations(imdbId, locations, isMovie)
        } catch (error) {
            this.logger.error(
                `Failed to sync locations for title with imdbId: ${imdbId}:`,
                error,
            )
            return false
        }
    }

    private async syncLocations(
        imdbId: string,
        locations: RawLocation[],
        isMovie?: boolean,
    ): Promise<boolean> {
        const cacheKey = `locations_${imdbId}`

        try {
            await this.cacheService.set(cacheKey, locations, this.CACHE_TTL)

            if (!locations?.length) return true

            const { title, type } = await this.titleService.findByImdbId(
                imdbId,
                isMovie,
            )

            await this.saveLocations(locations, title.id, type)
            return true
        } catch (error) {
            this.logger.error(`Error syncing locations for ${imdbId}:`, error)
            return false
        }
    }

    private async saveLocations(
        locations: RawLocation[],
        titleId: bigint,
        titleType: TitleType,
    ): Promise<void> {
        try {
            const addresses = locations.map((loc) => loc.address)
            const geocodedResults =
                await this.geocodingService.batchGeocodeAddresses(addresses)

            for (const rawLocation of locations) {
                const geoResult = geocodedResults.get(rawLocation.address)
                const location = await this.getOrCreateLocation(
                    rawLocation,
                    geoResult,
                )
                await this.createFilmingLocation(
                    location.id,
                    rawLocation,
                    titleId,
                    titleType,
                )
            }
        } catch (error) {
            this.logger.error(`Error saving locations for title:`, error)
            throw error
        }
    }

    private async getOrCreateLocation(
        rawLocation: RawLocation,
        geoResult?: GeocodeResult,
    ) {
        try {
            const location = await this.db.query.locations.findFirst({
                where: eq(locationsSchema.address, rawLocation.address),
            })

            this.logger.log(JSON.stringify(geoResult))

            const locationData = {
                address: rawLocation.address,
                formattedAddress: geoResult?.formatted || null,
                coordinates: geoResult
                    ? {
                          x: geoResult.lon,
                          y: geoResult.lat,
                      }
                    : null,
            }

            if (!location) {
                const [newLocation] = await this.db
                    .insert(locationsSchema)
                    .values(locationData)
                    .returning()
                return newLocation
            } else if (!location.coordinates && geoResult) {
                const [updatedLocation] = await this.db
                    .update(locationsSchema)
                    .set(locationData)
                    .where(eq(locationsSchema.id, location.id))
                    .returning()
                return updatedLocation
            }

            return location
        } catch (error) {
            this.logger.error(
                `Error getting or creating location for ${rawLocation.address}:`,
                error,
            )
            throw error
        }
    }

    private async createFilmingLocation(
        locationId: bigint,
        rawLocation: RawLocation,
        titleId: bigint,
        titleType: TitleType,
    ) {
        const [movieId, seriesId] = [
            titleType === TitleType.MOVIES ? titleId : null,
            titleType === TitleType.MOVIES ? null : titleId,
        ]

        const filmingLocation = {
            locationId,
            movieId,
            seriesId,
            description: rawLocation.description || '',
        }

        await this.db
            .insert(filmingLocations)
            .values(filmingLocation)
            .onConflictDoNothing({
                target: movieId
                    ? [filmingLocations.movieId, filmingLocations.locationId]
                    : [filmingLocations.seriesId, filmingLocations.locationId],
            })
    }

    private createEmptyResult(): LocationsSyncResult {
        return {
            success: true,
            processedCount: 0,
            failedCount: 0,
            errors: [],
            syncedImdbIds: [],
        }
    }

    private createErrorResult(message: string): LocationsSyncResult {
        return {
            ...this.createEmptyResult(),
            success: false,
            errors: [`Sync error: ${message}`],
        }
    }

    private updateSyncResult(
        result: LocationsSyncResult,
        imdbId: string,
        success: boolean,
    ) {
        if (success) {
            result.processedCount++
            result.syncedImdbIds.push(imdbId)
        } else {
            result.failedCount++
            result.errors.push(`Failed to sync locations for ${imdbId}`)
        }
    }

    private handleSyncError(
        result: LocationsSyncResult,
        imdbId: string,
        error: Error,
    ) {
        result.failedCount++
        result.errors.push(`Error syncing ${imdbId}: ${error.message}`)
    }

    private handleUnprocessedIds(
        result: LocationsSyncResult,
        imdbIds: string[],
        locationsMap: Map<string, RawLocation[]>,
    ) {
        const unprocessedIds = imdbIds.filter((id) => !locationsMap.has(id))
        unprocessedIds.forEach((id) => {
            result.failedCount++
            result.errors.push(`ID not processed: ${id}`)
        })
        result.success = result.failedCount === 0
    }
}
