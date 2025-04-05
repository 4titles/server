import { Injectable, Logger } from '@nestjs/common'
import { TitleRelationsConfigService } from '../../config/title-relations.config'
import { TitleSupportedLanguage } from '../../enums/title-supported-languages.enum'
import { LocationDescriptionDto } from '../../modules/filming-location/dto/location-description.dto'
import { FilmingLocationDescriptionService } from '../../modules/filming-location/services/filming-location-description.service'
import { FilmingLocationService } from '../../modules/filming-location/services/filming-location.service'
import { TitleService } from '../title.service'
import { TitleElasticsearchLocationSyncService } from './title-elasticsearch-location-sync.service'

@Injectable()
export class TitleLocationDescriptionSyncService {
    private readonly logger = new Logger(
        TitleLocationDescriptionSyncService.name,
    )

    constructor(
        private readonly titleService: TitleService,
        private readonly filmingLocationService: FilmingLocationService,
        private readonly filmingLocationDescriptionService: FilmingLocationDescriptionService,
        private readonly titleEsLocationSyncService: TitleElasticsearchLocationSyncService,
        private readonly titleRelationsConfig: TitleRelationsConfigService,
    ) {}

    async enhanceLocationDescription(
        titleId: string,
        locationId: string,
        language: string = TitleSupportedLanguage.EN,
    ): Promise<boolean> {
        try {
            const title = await this.titleService.findById(titleId, {
                customRelations:
                    this.titleRelationsConfig.BASIC_DETAILS_WITH_TRANSLATIONS,
            })

            if (!title) {
                this.logger.warn(`Title with id ${titleId} not found`)
                return false
            }

            const location =
                await this.filmingLocationService.findById(locationId)
            if (!location) {
                this.logger.warn(`Location with id ${locationId} not found`)
                return false
            }

            if (location.enhancedDescription) {
                this.logger.debug(
                    `Location ${locationId} already has an enhanced description`,
                )
                return true
            }

            const translations = (title as any).translations || []
            const translation =
                translations.find((t) => t.language?.iso === language) ||
                translations.find(
                    (t) => t.language?.iso === TitleSupportedLanguage.EN,
                )

            if (!translation) {
                this.logger.warn(
                    `No translation found for title ${titleId} in language ${language}`,
                )
                return false
            }

            const genres =
                (title as any).genres?.map((genre) => genre.genre.name) || []
            const countryName = (location as any).country?.name || ''

            const locationDescriptionDto = new LocationDescriptionDto({
                titleId,
                locationId,
                titleName: title.originalName,
                titleType: title.type,
                titleYear:
                    title.releaseDate instanceof Date
                        ? title.releaseDate.getFullYear().toString()
                        : String(new Date(title.releaseDate).getFullYear()),
                titleGenres: genres,
                titlePlot: translation.overview,
                locationAddress: location.address,
                locationCity: location.city,
                locationState: location.state,
                locationCountry: countryName,
                language,
            })

            const description =
                await this.filmingLocationDescriptionService.generateLocationDescription(
                    locationDescriptionDto,
                )

            if (!description) {
                this.logger.warn(
                    `Failed to generate description for location ${locationId}`,
                )
                return false
            }

            await this.filmingLocationService.updateEnhancedDescription(
                locationId,
                description,
            )

            const updatedLocation =
                await this.filmingLocationService.findById(locationId)
            if (updatedLocation) {
                this.logger.debug(
                    `Successfully updated enhanced description for location ${locationId}, syncing with Elasticsearch...`,
                )

                const titleWithLocations = await this.titleService.findById(
                    titleId,
                    {
                        customRelations:
                            this.titleRelationsConfig.FILMING_LOCATIONS_ONLY,
                    },
                )

                if (titleWithLocations) {
                    this.logger.debug(
                        `Updating title ${titleId} filming locations in Elasticsearch`,
                    )
                    await this.titleEsLocationSyncService.updateTitleFilmingLocations(
                        titleId,
                        (titleWithLocations as any).filmingLocations,
                    )
                } else {
                    this.logger.warn(
                        `Failed to retrieve title ${titleId} with filming locations for ES update`,
                    )
                }
            } else {
                this.logger.debug('Updated location not found')
            }

            this.logger.debug(
                `Successfully enhanced description for location ${locationId}`,
            )

            return true
        } catch (error) {
            this.logger.error(
                `Failed to enhance location description for location ${locationId} of title ${titleId}`,
                error.stack,
            )
            return false
        }
    }
}
