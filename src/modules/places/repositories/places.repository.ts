import { Injectable } from '@nestjs/common'
import { IPlace } from '../interfaces/place.interface'
import { PlaceFiltersDto } from '../dto/place-filters.dto'
import { CacheService } from '../services/cache.service'

@Injectable()
export class PlacesRepository {
    private readonly CACHE_PREFIX = 'places:'

    constructor(private readonly cacheService: CacheService) {}

    async findAll(filters?: PlaceFiltersDto): Promise<IPlace[]> {
        const cacheKey = this.generateCacheKey(filters)
        return this.cacheService.get<IPlace[]>(cacheKey)
    }

    async save(places: IPlace[]): Promise<void> {
        const cacheKey = this.generateCacheKey()
        await this.cacheService.set(cacheKey, places)
    }

    private generateCacheKey(filters?: PlaceFiltersDto): string {
        if (!filters) {
            return `${this.CACHE_PREFIX}all`
        }

        return `${this.CACHE_PREFIX}${JSON.stringify(filters)}`
    }
}
