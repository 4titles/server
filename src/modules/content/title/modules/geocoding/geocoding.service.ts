import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import {
    GeocodingApiResponse,
    GeocodingResultPropery,
} from './interfaces/geocoding-response.interface'
import { GeocodingResult } from './models/geocoding-result.model'

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name)
    private readonly apiKey: string
    private readonly baseUrl: string
    private readonly defaultRequestParams: Record<string, string>

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.apiKey = this.configService.getOrThrow<string>('GEOAPIFY_KEY')
        this.baseUrl = this.configService.getOrThrow<string>(
            'GEOAPIFY_GEOCODING_URL',
        )
        this.defaultRequestParams = {
            format: 'json',
            apiKey: this.apiKey,
        }
    }
    async geocodeAddress(
        address: string,
        limit: string = '1',
    ): Promise<GeocodingResult[]> {
        try {
            if (!address?.trim()) {
                this.logger.warn('Empty address provided for geocoding')
                return []
            }

            const params = new URLSearchParams({
                ...this.defaultRequestParams,
                limit,
                text: address.trim(),
            })

            const response = await firstValueFrom(
                this.httpService.get<GeocodingApiResponse>(
                    `${this.baseUrl}?${params}`,
                ),
            )
            const results: GeocodingResultPropery[] = response.data.results

            if (!results?.length) {
                this.logger.debug(
                    `No geocoding results found for address: ${address}`,
                )
                return []
            }

            return results.map((feature) => ({
                lat: feature.lat,
                lon: feature.lon,
                formattedAddress: feature.formatted,
                confidence: feature.rank.confidence,
                resultType: feature.result_type,
                countryCode: feature.country_code,
                street: feature.street,
                city: feature.city,
                state: feature.state,
                placeId: feature.place_id,
            }))
        } catch (error) {
            this.logger.error(
                `Failed to geocode address: ${address}. Status: ${error.response?.status}. Message: ${error.message}`,
                error.stack,
            )

            return []
        }
    }
}
