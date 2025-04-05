import { Injectable, Logger } from '@nestjs/common'
import { TitleRelationsConfigService } from '../../config/title-relations.config'
import { TitleCategory } from '../../enums/title-category.enum'
import { FilmingLocationParserService } from '../../modules/filming-location/services/filming-location-parser.service'
import { FilmingLocationService } from '../../modules/filming-location/services/filming-location.service'
import { TitleCacheService } from '../cache/title-cache.service'
import { TitleRelationService } from '../relations/title-relation.service'
import { TitleService } from '../title.service'
import { TitleChangeDetectorService } from '../utils/title-change-detector.service'
import { TitleElasticsearchLocationSyncService } from './title-elasticsearch-location-sync.service'
import { TitleLocationDescriptionSyncQueueService } from './title-location-description-sync-queue.service'

@Injectable()
export class TitleLocationSyncService {
    private readonly logger = new Logger(TitleLocationSyncService.name)

    constructor(
        private readonly titleService: TitleService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly filmingLocationParserService: FilmingLocationParserService,
        private readonly titleRelationService: TitleRelationService,
        private readonly titleCacheService: TitleCacheService,
        private readonly titleChangeDetectorService: TitleChangeDetectorService,
        private readonly titleEsLocationSyncService: TitleElasticsearchLocationSyncService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
        private readonly descriptionSyncQueueService: TitleLocationDescriptionSyncQueueService,
    ) {}

    async syncTitleLocations(
        titleId: string,
        imdbId: string,
        category: TitleCategory,
    ): Promise<void> {
        try {
            const cachedLocations =
                await this.titleCacheService.getFilmingLocations(
                    titleId,
                    category,
                )

            const rawLocations =
                await this.filmingLocationParserService.getFilmingLocations(
                    imdbId,
                )

            if (!rawLocations || rawLocations.length === 0) {
                this.logger.debug(
                    `No locations found for imdbId: https://www.imdb.com/title/${imdbId}/locations`,
                )

                if (cachedLocations) {
                    await this.titleCacheService.storeFilmingLocations(
                        titleId,
                        category,
                        [],
                    )
                }

                return
            }

            const locationsChanged =
                this.titleChangeDetectorService.areLocationsChanged(
                    cachedLocations,
                    rawLocations,
                )

            if (!locationsChanged) {
                await this.titleCacheService.extendFilmingLocationsTTL(
                    titleId,
                    category,
                )

                return
            }

            const locationIds: string[] = []

            for (const location of rawLocations) {
                const geocodedLocations =
                    await this.filmingLocationService.geocodeLocationsByAddress(
                        location.address,
                    )

                if (!geocodedLocations) continue

                const createdLocationIds = await Promise.all(
                    geocodedLocations.map(async (loc) => {
                        const existingLocation =
                            await this.filmingLocationService.findByPlaceId(
                                loc.placeId,
                            )

                        if (existingLocation) return existingLocation.id

                        await this.filmingLocationService.createFilmingLocation(
                            loc,
                            location,
                        )

                        const newLocation =
                            await this.filmingLocationService.findByPlaceId(
                                loc.placeId,
                            )

                        this.logger.debug(
                            `Location ${newLocation.id} created, trying to add to queue of description sync`,
                        )

                        if (newLocation && !newLocation.enhancedDescription) {
                            this.logger.debug(
                                `Adding description job for location ${newLocation.id} of title ${titleId}`,
                            )
                            try {
                                await this.descriptionSyncQueueService.addLocationDescriptionJob(
                                    titleId,
                                    newLocation.id,
                                )
                                this.logger.debug(
                                    `Successfully added description job for location ${newLocation.id}`,
                                )
                            } catch (error) {
                                this.logger.error(
                                    `Failed to add description job for location ${newLocation.id}: ${error.message}`,
                                    error.stack,
                                )
                            }
                        } else {
                            this.logger.debug(
                                `Location ${newLocation.id} already has an enhanced description or location not found`,
                            )
                        }

                        return newLocation.id
                    }),
                )

                locationIds.push(...createdLocationIds)
            }

            if (locationIds.length > 0) {
                await this.titleRelationService.createFilmingLocationRelations(
                    titleId,
                    locationIds,
                )

                const title = await this.titleService.findById(titleId, {
                    customRelations:
                        this.titleRelationsConfig.FILMING_LOCATIONS_ONLY,
                })

                if (title) {
                    const titleWithLocations = title as any
                    if (titleWithLocations.filmingLocations) {
                        await this.titleEsLocationSyncService.updateTitleFilmingLocations(
                            titleId,
                            titleWithLocations.filmingLocations,
                        )
                    }
                }

                await this.titleCacheService.storeFilmingLocations(
                    titleId,
                    category,
                    rawLocations,
                )

                await this.titleService.updateHasLocations(titleId, true)
            }
        } catch (error) {
            this.logger.error(
                `Failed to sync locations for title ${titleId}`,
                error.stack,
            )
            throw error
        }
    }
}
