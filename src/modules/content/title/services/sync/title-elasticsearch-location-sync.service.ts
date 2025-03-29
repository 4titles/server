import { Injectable, Logger } from '@nestjs/common'
import { TitleElasticsearchService } from '../../modules/elasticsearch/title-elasticsearch.service'

@Injectable()
export class TitleElasticsearchLocationSyncService {
    private readonly logger = new Logger(
        TitleElasticsearchLocationSyncService.name,
    )

    constructor(
        private readonly titleElasticsearchService: TitleElasticsearchService,
    ) {}

    async updateTitleFilmingLocations(
        titleId: string,
        filmingLocations: any[],
    ): Promise<boolean> {
        try {
            const formattedLocations =
                this.prepareFilmingLocationsForES(filmingLocations)

            const result =
                await this.titleElasticsearchService.updateTitleWithFilmingLocations(
                    titleId,
                    formattedLocations,
                )

            if (result) {
                this.logger.log(
                    `Successfully updated filming locations for title ${titleId} in Elasticsearch`,
                )
            } else {
                this.logger.warn(
                    `Failed to update filming locations for title ${titleId} in Elasticsearch`,
                )
            }

            return result
        } catch (error) {
            this.logger.error(
                `Error updating filming locations for title ${titleId} in Elasticsearch:`,
                error,
            )
            return false
        }
    }

    private prepareFilmingLocationsForES(dbLocations: any[]): any[] {
        if (!dbLocations || dbLocations.length === 0) {
            return []
        }

        return dbLocations.map((rel) => {
            const loc = rel.filmingLocation
            const country = loc.country
            return {
                id: loc.id,
                placeId: loc.placeId,
                address: loc.address,
                formattedAddress: loc.formattedAddress,
                city: loc.city,
                state: loc.state,
                countryId: country?.id ?? null,
                countryCode: country?.iso ?? null,
                countryName: country?.name ?? null,
                coordinates: loc.coordinates
                    ? { lat: loc.coordinates.y, lon: loc.coordinates.x }
                    : null,
                description: loc.description,
                enhancedDescription: loc.enhancedDescription,
            }
        })
    }
}
