import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from '@/modules/cache/cache.service'
import { TitlesService } from './titles.service'
import { TitleCategory } from '../enums/title-category.enum'
import { TitleType } from '../enums/title-type.enum'
import { SyncResult } from '../models/sync-result.model'

interface SyncConfig {
    minInterval: number
    cacheTTL: number
    batchSize: number
}

@Injectable()
export class TitleSyncManagerService {
    private readonly logger = new Logger(TitleSyncManagerService.name)
    private readonly SYNC_LOCK_TTL = 300 // 5 min

    private readonly SYNC_CONFIGS: Partial<Record<TitleCategory, SyncConfig>> =
        {
            [TitleCategory.TRENDING]: {
                minInterval: 30 * 60 * 1000, // 30 min
                cacheTTL: 3600, // 1 h
                batchSize: 20,
            },
            [TitleCategory.POPULAR]: {
                minInterval: 4 * 60 * 60 * 1000, // 4 h
                cacheTTL: 6 * 3600, // 6 h
                batchSize: 20,
            },
            [TitleCategory.TOP_RATED]: {
                minInterval: 12 * 60 * 60 * 1000, // 12 h
                cacheTTL: 24 * 3600, // 24 h
                batchSize: 50,
            },
            [TitleCategory.UPCOMING]: {
                minInterval: 24 * 60 * 60 * 1000, // 24 h
                cacheTTL: 48 * 3600, // 48 h
                batchSize: 50,
            },
            [TitleCategory.AIRING]: {
                minInterval: 24 * 60 * 60 * 1000, // 24 h
                cacheTTL: 48 * 3600, // 48 h
                batchSize: 50,
            },
        }

    constructor(
        private readonly cacheService: CacheService,
        private readonly titlesService: TitlesService,
    ) {}

    private getKeys(category: TitleCategory, type: TitleType = TitleType.ALL) {
        const base = `titles:${category}:${type}`
        return {
            lock: `lock:${base}`,
            cache: `data:${base}`,
            lastSync: `lastSync:${base}`,
            hash: `hash:${base}`,
        }
    }

    private async acquireLock(lockKey: string): Promise<boolean> {
        return await this.cacheService.setNX(
            lockKey,
            Date.now().toString(),
            this.SYNC_LOCK_TTL,
        )
    }

    private async releaseLock(lockKey: string): Promise<void> {
        await this.cacheService.del(lockKey)
    }

    private async calculateDataHash(data: SyncResult): Promise<string> {
        return JSON.stringify({
            moviesCount: data.moviesCount,
            tvShowsCount: data.tvShowsCount,
        })
    }

    private async shouldSync(
        category: TitleCategory,
        type: TitleType,
    ): Promise<boolean> {
        const keys = this.getKeys(category, type)
        const [lastSync, currentHash] = await Promise.all([
            this.cacheService.get(keys.lastSync),
            this.cacheService.get(keys.hash),
        ])

        if (!lastSync || !currentHash) {
            return true
        }

        const now = Date.now()
        const lastSyncTime = parseInt(lastSync as string)
        const timeDiff = now - lastSyncTime

        return timeDiff >= this.SYNC_CONFIGS[category].minInterval
    }

    private async syncWithRetry(
        category: TitleCategory,
        type: TitleType,
        maxRetries = 3,
    ): Promise<SyncResult> {
        let lastError: Error

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let result: SyncResult

                switch (category) {
                    case TitleCategory.TRENDING:
                        result =
                            await this.titlesService.syncTrendingTitles(type)
                        break
                    case TitleCategory.POPULAR:
                        result =
                            await this.titlesService.syncPopularTitles(type)
                        break
                    case TitleCategory.TOP_RATED:
                        result =
                            await this.titlesService.syncTopRatedTitles(type)
                        break
                    case TitleCategory.UPCOMING:
                        result = await this.titlesService.syncUpcomingTitles()
                        break
                    case TitleCategory.AIRING:
                        result = await this.titlesService.syncAiringTitles()
                        break
                    default:
                        throw new Error(`Unsupported category: ${category}`)
                }

                return result
            } catch (error) {
                lastError = error
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * attempt),
                )
            }
        }

        throw lastError
    }

    async syncCategory(
        category: TitleCategory,
        type: TitleType = TitleType.ALL,
    ): Promise<void> {
        const keys = this.getKeys(category, type)

        if (!(await this.shouldSync(category, type))) {
            this.logger.debug(
                `Skipping sync for ${category} ${type} - recent sync exists`,
            )
            return
        }

        if (!(await this.acquireLock(keys.lock))) {
            this.logger.debug(
                `Sync already in progress for ${category} ${type}`,
            )
            return
        }

        try {
            this.logger.log(`Starting sync for ${category} ${type}`)

            const result = await this.syncWithRetry(category, type)
            const newHash = await this.calculateDataHash(result)
            const currentHash = await this.cacheService.get(keys.hash)

            if (currentHash === newHash) {
                await this.cacheService.set(
                    keys.lastSync,
                    Date.now().toString(),
                )
                this.logger.log(`No changes detected for ${category} ${type}`)
                return
            }

            const config = this.SYNC_CONFIGS[category]
            await Promise.all([
                this.cacheService.set(keys.cache, result, config.cacheTTL),
                this.cacheService.set(keys.lastSync, Date.now().toString()),
                this.cacheService.set(keys.hash, newHash),
            ])

            this.logger.log(`Successfully synced ${category} ${type}`)
        } catch (error) {
            this.logger.error(`Failed to sync ${category} ${type}:`, error)
            throw error
        } finally {
            await this.releaseLock(keys.lock)
        }
    }

    async syncAll(): Promise<void> {
        const categories = Object.values(TitleCategory)

        for (const category of categories) {
            await this.syncCategory(category)
        }
    }
}
