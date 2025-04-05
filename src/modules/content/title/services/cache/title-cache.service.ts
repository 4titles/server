import { CacheService } from '@/modules/infrastructure/cache/cache.service'
import { Injectable, Logger } from '@nestjs/common'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleSyncTimestamp } from '../../enums/title-sync-timestamp.enum'
import { RawLocation } from '../../modules/filming-location/interfaces/raw-location.interface'

@Injectable()
export class TitleCacheService {
    private readonly logger = new Logger(TitleCacheService.name)
    private readonly REDIS_KEY_PREFIX = 'title:'
    private readonly TITLES_LIST_PREFIX = 'titles:list:'
    private readonly SYNC_CATEGORY_PREFIX = 'sync:category:'
    private readonly SYNC_ACTIVE_IDS_PREFIX = 'sync:active_ids:'
    private readonly REDIS_EXPIRE_TIME = 60 * 60 * 24 * 7 // 1 week
    private readonly SYNC_SET_EXPIRE_TIME = 60 * 60 * 12 // 12 hours

    constructor(private readonly cacheService: CacheService) {}

    async clearAllTitlesCache(): Promise<void> {
        try {
            const client = await this.cacheService.getClient()
            const titleKeys = await client.keys(`${this.REDIS_KEY_PREFIX}*`)
            const titlesListKeys = await client.keys(
                `${this.TITLES_LIST_PREFIX}*`,
            )
            const syncTimestampKeys = await client.keys(
                `${this.SYNC_CATEGORY_PREFIX}*`,
            )
            const syncActiveIdsKeys = await client.keys(
                `${this.SYNC_ACTIVE_IDS_PREFIX}*`,
            )
            const keys = [
                ...titleKeys,
                ...titlesListKeys,
                ...syncTimestampKeys,
                ...syncActiveIdsKeys,
            ]

            this.logger.debug(
                `Deleting ${keys.length} keys related to titles and sync status from Redis`,
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

    async invalidateTitlesListCache(): Promise<void> {
        try {
            const client = await this.cacheService.getClient()
            const titlesListKeys = await client.keys(
                `${this.TITLES_LIST_PREFIX}*`,
            )

            if (titlesListKeys.length > 0) {
                this.logger.debug(
                    `Invalidating ${titlesListKeys.length} titles list cache keys`,
                )

                const batchSize = 1000
                for (let i = 0; i < titlesListKeys.length; i += batchSize) {
                    const batch = titlesListKeys.slice(i, i + batchSize)
                    await Promise.all(batch.map((key) => client.del(key)))
                }

                this.logger.debug('Titles list cache invalidated successfully')
            }
        } catch (error) {
            this.logger.error('Failed to invalidate titles list cache:', error)
        }
    }

    async invalidateCategoryTitlesListCache(
        category: TitleCategory,
    ): Promise<void> {
        try {
            const client = await this.cacheService.getClient()
            const categoryPattern = `${this.TITLES_LIST_PREFIX}${category}:*`
            const titlesListKeys = await client.keys(categoryPattern)

            if (titlesListKeys.length > 0) {
                this.logger.debug(
                    `Invalidating ${titlesListKeys.length} cache keys for category ${category}`,
                )
                await Promise.all(titlesListKeys.map((key) => client.del(key)))
                this.logger.debug(
                    `Cache for category ${category} invalidated successfully`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to invalidate cache for category ${category}:`,
                error,
            )
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
        const exists = await this.cacheService.exists(key)
        if (exists) {
            const data = await this.cacheService.get(key)
            if (data) {
                await this.cacheService.set(key, data, this.REDIS_EXPIRE_TIME)
            }
        }
    }

    private getFilmingLocationsKey(
        titleId: string,
        category: TitleCategory,
    ): string {
        return `${this.REDIS_KEY_PREFIX}${category.toLowerCase()}:${titleId}:filming_locations`
    }

    async setCategorySyncTimestamp(
        category: TitleCategory,
        type: TitleSyncTimestamp,
    ): Promise<void> {
        const key = `${this.SYNC_CATEGORY_PREFIX}${category}:${type}`
        await this.cacheService.set(
            key,
            new Date().toISOString(),
            this.REDIS_EXPIRE_TIME,
        )
    }

    async getCategorySyncTimestamp(
        category: TitleCategory,
        type: TitleSyncTimestamp,
    ): Promise<string | null> {
        const key = `${this.SYNC_CATEGORY_PREFIX}${category}:${type}`
        return await this.cacheService.get<string>(key)
    }

    async startCategorySyncTracking(category: TitleCategory): Promise<void> {
        const key = this.getActiveIdsKey(category)
        try {
            this.logger.debug(
                `Starting active ID tracking for category: ${category} (Key: ${key})`,
            )
            const client = await this.cacheService.getClient()
            await client.del(key)
            await client.expire(key, this.SYNC_SET_EXPIRE_TIME)
        } catch (error) {
            this.logger.error(
                `Failed to start sync tracking for category ${category}:`,
                error,
            )
            throw error
        }
    }

    async addActiveTitleIds(
        category: TitleCategory,
        tmdbIds: string[],
    ): Promise<void> {
        if (tmdbIds.length === 0) return
        const key = this.getActiveIdsKey(category)
        try {
            const client = await this.cacheService.getClient()
            await client.sadd(key, tmdbIds)
            await client.expire(key, this.SYNC_SET_EXPIRE_TIME)
        } catch (error) {
            this.logger.error(
                `Failed to add active IDs for category ${category}:`,
                error,
            )
        }
    }

    async getActiveTitleIds(category: TitleCategory): Promise<Set<string>> {
        const key = this.getActiveIdsKey(category)
        try {
            const client = await this.cacheService.getClient()
            const members = await client.smembers(key)
            return new Set(members)
        } catch (error) {
            this.logger.error(
                `Failed to get active IDs for category ${category}:`,
                error,
            )
            return new Set()
        }
    }

    async finishCategorySyncTracking(category: TitleCategory): Promise<void> {
        const key = this.getActiveIdsKey(category)
        try {
            this.logger.debug(
                `Finishing active ID tracking for category: ${category} (Key: ${key})`,
            )
            const client = await this.cacheService.getClient()
            await client.del(key)
        } catch (error) {
            this.logger.error(
                `Failed to finish sync tracking for category ${category}:`,
                error,
            )
        }
    }

    private getActiveIdsKey(category: TitleCategory): string {
        return `${this.SYNC_ACTIVE_IDS_PREFIX}${category}`
    }
}
