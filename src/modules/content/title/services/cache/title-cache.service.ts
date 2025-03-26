import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { Injectable, Logger } from '@nestjs/common'
import { defaultTitleSyncConfig } from '../../config/title-sync.config'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleSyncResult } from '../../models/title-sync-result.model'
import { RawLocation } from '../../modules/filming-location/interfaces/raw-location.interface'

@Injectable()
export class TitleCacheService {
    private readonly logger = new Logger(TitleCacheService.name)
    private readonly REDIS_KEY_PREFIX = 'title:'
    private readonly REDIS_EXPIRE_TIME = 60 * 60 * 24 * 7 // 1 week
    private readonly titleSyncConfig = defaultTitleSyncConfig

    constructor(private readonly cacheService: CacheService) {}

    async clearAllTitlesCache(): Promise<void> {
        try {
            const client = await this.cacheService.getClient()
            const keys = await client.keys(`${this.REDIS_KEY_PREFIX}*`)

            this.logger.debug(
                `Deleting ${keys.length} keys related to titles from Redis`,
            )

            const batchSize = 1000
            for (let i = 0; i < keys.length; i += batchSize) {
                const batch = keys.slice(i, i + batchSize)
                await Promise.all(batch.map((key) => client.del(key)))
            }

            this.logger.debug('Redis cache cleared successfully')
        } catch (error) {
            this.logger.error('Failed to clear Redis cache:', error)
            throw error
        }
    }

    async getFilmingLocations(
        titleId: string,
        category: TitleCategory,
    ): Promise<RawLocation[] | null> {
        const data = await this.cacheService.get<string>(
            this.getFilmingLocationsKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async storeFilmingLocations(
        titleId: string,
        category: TitleCategory,
        locations: RawLocation[],
    ): Promise<void> {
        await this.cacheService.set(
            this.getFilmingLocationsKey(titleId, category),
            JSON.stringify(locations),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async extendFilmingLocationsTTL(
        titleId: string,
        category: TitleCategory,
    ): Promise<void> {
        const key = this.getFilmingLocationsKey(titleId, category)
        await this.cacheService.set(
            key,
            await this.cacheService.get(key),
            this.REDIS_EXPIRE_TIME,
        )
    }

    private getFilmingLocationsKey(
        titleId: string,
        category: TitleCategory,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:filming_locations`
    }

    async storeSyncResult(
        titleId: string,
        category: TitleCategory,
        result: TitleSyncResult,
    ): Promise<void> {
        const key = this.getSyncResultKey(titleId, category)
        await this.cacheService.set(
            key,
            JSON.stringify(result),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async getSyncResult(
        titleId: string,
        category: TitleCategory,
    ): Promise<TitleSyncResult | null> {
        const data = await this.cacheService.get<string>(
            this.getSyncResultKey(titleId, category),
        )
        return data ? JSON.parse(data) : null
    }

    async extendSyncResultTTL(
        titleId: string,
        category: TitleCategory,
    ): Promise<void> {
        const key = this.getSyncResultKey(titleId, category)
        const data = await this.cacheService.get(key)
        if (data) {
            await this.cacheService.set(key, data, this.REDIS_EXPIRE_TIME)
        }
    }

    private getSyncResultKey(titleId: string, category: TitleCategory): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:sync_result`
    }

    async storeCategorySyncResult(
        category: TitleCategory,
        result: TitleSyncResult,
    ): Promise<void> {
        const key = `sync:category:${category}`
        const previousResult = await this.getCategorySyncResult(category)

        if (previousResult) {
            result = {
                ...result,
                total: Math.min(
                    result.total,
                    this.titleSyncConfig.limits[category],
                ),
                processed: Math.min(
                    result.processed,
                    this.titleSyncConfig.limits[category],
                ),
                failed: [...previousResult.failed, ...result.failed],
            }
        }

        await this.cacheService.set(key, JSON.stringify(result), 86400)
    }

    async getCategorySyncResult(
        category: TitleCategory,
    ): Promise<TitleSyncResult | null> {
        const key = `sync:category:${category}`
        const result = await this.cacheService.get<string>(key)
        return result ? JSON.parse(result) : null
    }

    async getSyncResults(): Promise<Record<TitleCategory, TitleSyncResult>> {
        const categories = Object.values(TitleCategory)
        const results: Record<TitleCategory, TitleSyncResult> = {} as Record<
            TitleCategory,
            TitleSyncResult
        >

        for (const category of categories) {
            results[category] = await this.getCategorySyncResult(category)
        }

        return results
    }

    async getCategoryProcessedCount(category: TitleCategory): Promise<number> {
        const result = await this.getCategorySyncResult(category)
        return result?.processed || 0
    }
}
