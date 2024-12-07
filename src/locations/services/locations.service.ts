import { Inject, Injectable, Logger } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { DRIZZLE } from 'src/drizzle/drizzle.module'
import { DrizzleDB } from 'src/drizzle/types/drizzle'
import { ImdbParserService } from './imdb-parser.service'
import { RawLocation } from '../interfaces/raw-location.interface'
import { TitleEntityService } from 'src/titles/services/title-entity.service'
import { eq, and, isNull } from 'drizzle-orm'
import {
    locations as locationsSchema,
    filmingLocations,
} from 'src/drizzle/schema/filming-locations.schema'
import { FilmingLocation } from '../models/filming-location.model'
import { LocationsSyncResult } from '../models/locations-sync-result.model'
import { GeocodingService } from 'src/geocoding/services/geocoding.service'
import { GeocodeResult } from 'src/geocoding/interfaces/geocode-result.interface'

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name)
    private readonly CACHE_TTL = 24 * 60 * 60 * 30 // 30 days

    constructor(
        @Inject(DRIZZLE) private readonly db: DrizzleDB,
        private readonly cacheService: CacheService,
        private readonly imdbParserService: ImdbParserService,
        private readonly titleEntityService: TitleEntityService,
        private readonly geocodingService: GeocodingService,
    ) {}

    async getLocationsForTitle(
        imdbId: string,
        isMovie: boolean,
    ): Promise<FilmingLocation[]> {
        try {
            const entity = isMovie
                ? await this.titleEntityService.getMovieEntityByImdbId(imdbId)
                : await this.titleEntityService.getTvShowEntityByImdbId(imdbId)

            if (!entity) return []

            const result = await this.db.query.filmingLocations.findMany({
                where: isMovie
                    ? and(
                          eq(filmingLocations.movieId, BigInt(entity.id)),
                          isNull(filmingLocations.seriesId),
                      )
                    : and(
                          eq(filmingLocations.seriesId, BigInt(entity.id)),
                          isNull(filmingLocations.movieId),
                      ),
                with: {
                    location: true,
                    movie: isMovie ? true : undefined,
                    tvShow: !isMovie ? true : undefined,
                },
            })

            return result.map(this.mapFilmingLocation)
        } catch (error) {
            this.logger.error(
                `Error fetching locations for ImdbId ${imdbId}:`,
                error,
            )
            throw error
        }
    }

    async syncAllLocations(): Promise<LocationsSyncResult> {
        try {
            const imdbIds = await this.getAllImdbIds()
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

    async syncLocationsForTitle(imdbId: string): Promise<boolean> {
        try {
            const locations =
                await this.imdbParserService.getFilmingLocations(imdbId)

            const cacheKey = `locations_${imdbId}`
            await this.cacheService.set(cacheKey, locations, this.CACHE_TTL)

            return await this.syncLocations(imdbId, locations)
        } catch (error) {
            this.logger.error(
                `Failed to sync locations for title ${imdbId}:`,
                error,
            )
            return false
        }
    }

    private async syncLocations(
        imdbId: string,
        locations: RawLocation[],
    ): Promise<boolean> {
        const cacheKey = `locations_${imdbId}`

        try {
            await this.cacheService.set(cacheKey, locations, this.CACHE_TTL)

            if (!locations?.length) return true

            const { movie, series } = await this.getTitleEntities(imdbId)
            if (!movie && !series) {
                throw new Error(`Title with IMDB ID ${imdbId} not found`)
            }

            await this.saveLocations(locations, movie?.id, series?.id)
            return true
        } catch (error) {
            this.logger.error(`Error syncing locations for ${imdbId}:`, error)
            return false
        }
    }

    private async saveLocations(
        locations: RawLocation[],
        movieId?: bigint,
        seriesId?: bigint,
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
                    movieId,
                    seriesId,
                    rawLocation,
                )
            }
        } catch (error) {
            this.logger.error(
                `Error saving locations for ${movieId || seriesId}:`,
                error,
            )
            throw error
        }
    }

    private async getAllImdbIds(): Promise<string[]> {
        const [movies, series] = await Promise.all([
            this.titleEntityService.getAllMovies(),
            this.titleEntityService.getAllTvShows(),
        ])

        this.logger.log(
            `Found ${movies.length} movies and ${series.length} series`,
        )

        return [
            ...movies.filter((m) => m.imdbId).map((m) => m.imdbId),
            ...series.filter((s) => s.imdbId).map((s) => s.imdbId),
        ]
    }

    private async getTitleEntities(imdbId: string) {
        const [movie, series] = await Promise.all([
            this.titleEntityService.getMovieEntityByImdbId(imdbId),
            this.titleEntityService.getTvShowEntityByImdbId(imdbId),
        ])
        return { movie, series }
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
                          // lon = x, lat = y
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

    private formatPointForPostgres(lon: number, lat: number): string | null {
        if (!lon || !lat || isNaN(lon) || isNaN(lat)) {
            return null
        }
        return `(${lon},${lat})`
    }

    private async createFilmingLocation(
        locationId: bigint,
        movieId: bigint | null,
        seriesId: bigint | null,
        rawLocation: RawLocation,
    ) {
        const filmingLocation = {
            locationId,
            movieId: movieId ?? null,
            seriesId: seriesId ?? null,
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

    private mapFilmingLocation(item: any): FilmingLocation {
        let coordinates = null

        if (item.location.coordinates) {
            coordinates = {
                longitude: item.location.coordinates.x,
                latitude: item.location.coordinates.y,
            }
        }

        return {
            address: item.location.address,
            description: item.description || null,
            formattedAddress: item.location.formattedAddress || null,
            coordinates,
        }
    }
}
