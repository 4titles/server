import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { GeocodeResult } from '../interfaces/geocode-result.interface'

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name)
    private readonly apiKey: string
    private readonly baseUrl: string

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('geocoding.apiKey')
        this.baseUrl = this.configService.get<string>('geocoding.baseUrl')
    }

    async geocodeAddress(address: string): Promise<GeocodeResult | null> {
        try {
            const params = new URLSearchParams({
                text: address,
                format: 'json',
                apiKey: this.apiKey,
                limit: '1',
            })

            const response = await axios.get(`${this.baseUrl}?${params}`)
            const results = response.data.results

            if (results && results.length > 0) {
                const result = results[0]
                return {
                    lat: result.lat,
                    lon: result.lon,
                    formatted: result.formatted,
                    confidence: result.rank?.confidence || 0,
                }
            }

            return null
        } catch (error) {
            this.logger.error(`Failed to geocode address: ${address}`, error)
            return null
        }
    }

    async batchGeocodeAddresses(
        addresses: string[],
    ): Promise<Map<string, GeocodeResult>> {
        const results = new Map<string, GeocodeResult>()
        const chunks = this.chunkArray(addresses, 10)

        for (const chunk of chunks) {
            const promises = chunk.map(async (address) => {
                const result = await this.geocodeAddress(address)
                if (result) {
                    results.set(address, result)
                }
                await this.delay(200)
            })

            await Promise.all(promises)
            await this.delay(1000)
        }

        return results
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
            array.slice(i * size, i * size + size),
        )
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
