import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom } from 'rxjs'
import {
    IGeoapifyResponse,
    IGeoapifyFeature,
} from '../interfaces/geoapify-response.interface'
import { IPlace } from '../interfaces/place.interface'
import { PlaceFiltersDto } from '../dto/place-filters.dto'

@Injectable()
export class GeoapifyService {
    private readonly logger = new Logger(GeoapifyService.name)

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async fetchPlaces(filters?: PlaceFiltersDto): Promise<IPlace[]> {
        try {
            const { data } = await lastValueFrom(
                this.httpService.get<IGeoapifyResponse>(
                    this.configService.get('geoapify.baseUrl'),
                    {
                        params: this.buildQueryParams(filters),
                    },
                ),
            )

            return this.transformResponse(data.features)
        } catch (error) {
            this.logger.error(
                `Failed to fetch places from Geoapify: ${error.message}`,
            )
            throw error
        }
    }

    private buildQueryParams(
        filters?: PlaceFiltersDto,
    ): Record<string, string> {
        this.logger.debug(filters)
        const config = this.configService.get('geoapify')
        if (!config) {
            throw new Error('Geoapify configuration is not loaded')
        }
        const categories =
            filters?.categories?.join(',') ||
            Object.values(config.categories)
                .filter((cat) => cat !== 'entertainment')
                .join(',')

        return {
            categories,
            conditions: config.conditions,
            filter: filters?.radius
                ? config.filters.CITY_CIRCLE
                : config.filters.CITY_GEOMETRY,
            bias: config.bias.PROXIMITY,
            limit: String(config.queryLimit),
            apiKey: this.configService.get('GEOAPIFY_KEY'),
            ...(filters?.searchTerm && { name: filters.searchTerm }),
        }
    }

    private transformResponse(features: IGeoapifyFeature[]): IPlace[] {
        return features.map((feature) => ({
            id: feature.properties.place_id,
            name: feature.properties.name,
            country: feature.properties.country,
            city: feature.properties.city,
            coordinates: {
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
            },
            categories: feature.properties.categories || [],
            address: feature.properties.formatted,
        }))
    }
}
