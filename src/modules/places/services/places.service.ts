import { Injectable } from '@nestjs/common'
import { CacheService } from './cache.service'
import { GeoapifyService } from './geoapify.service'
import { IPlace } from '../interfaces/place.interface'

@Injectable()
export class PlacesService {
    private readonly CACHE_KEY = 'sevastopol_cultural_places'
    private readonly CACHE_TTL = 3600 * 24 // 1 day

    constructor(
        private readonly cacheService: CacheService,
        private readonly geoapifyService: GeoapifyService,
    ) {}

    async getPlaces(): Promise<IPlace[]> {
        try {
            const cachedPlaces = await this.cacheService.get<IPlace[]>(
                this.CACHE_KEY,
            )
            if (cachedPlaces) {
                return cachedPlaces
            }

            const places = await this.geoapifyService.fetchPlaces()
            await this.cacheService.set(this.CACHE_KEY, places, this.CACHE_TTL)

            return places
        } catch (error) {
            throw this.handleError(error)
        }
    }

    private handleError(error: any): Error {
        console.error('Error occurred in getPlaces:', error)
        return new Error('Failed to fetch cultural places')
    }
}
