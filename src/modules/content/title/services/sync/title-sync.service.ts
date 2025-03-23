import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TmdbTitleResponse } from '../../modules/tmdb/types/tmdb.interface'
import { TitleCacheService } from '../cache/title-cache.service'
import { TitleService } from '../title.service'
import { TitleChangeDetectorService } from '../utils/title-change-detector.service'
import { TitleFetcherService } from '../utils/title-fetcher.service'
import { TitleRelationService } from '../utils/title-relation.service'
import { TitleSyncQueueService } from './title-sync-queue.service'

@Injectable()
export class TitleSyncService {
    private readonly logger = new Logger(TitleSyncService.name)
    private readonly categoryConfigs: Record<
        TitleCategory,
        {
            maxPages: number
            syncInterval: number
            cronExpression: string
        }
    >

    constructor(
        private readonly titleSyncQueueService: TitleSyncQueueService,
        private readonly titleCacheService: TitleCacheService,
        private readonly titleRelationService: TitleRelationService,
        private readonly titleFetcherService: TitleFetcherService,
        private readonly titleService: TitleService,
        private readonly titleChangeDetectorService: TitleChangeDetectorService,
        private readonly configService: ConfigService,
    ) {
        this.categoryConfigs = {
            [TitleCategory.POPULAR]: {
                maxPages: 1,
                syncInterval:
                    this.configService.get<number>('sync.popularInterval') ||
                    24,
                cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
            },
            [TitleCategory.TRENDING]: {
                maxPages:
                    this.configService.get<number>('tmdb.maxTrendingPages') ||
                    3,
                syncInterval:
                    this.configService.get<number>('sync.trendingInterval') ||
                    12,
                cronExpression: CronExpression.EVERY_12_HOURS,
            },
            [TitleCategory.TOP_RATED]: {
                maxPages:
                    this.configService.get<number>('tmdb.maxTopRatedPages') ||
                    30,
                syncInterval:
                    this.configService.get<number>('sync.topRatedInterval') ||
                    96,
                cronExpression: CronExpression.EVERY_QUARTER,
            },
            [TitleCategory.AIRING]: {
                maxPages:
                    this.configService.get<number>('tmdb.maxAiringPages') || 5,
                syncInterval:
                    this.configService.get<number>('sync.airingInterval') || 12,
                cronExpression: CronExpression.EVERY_12_HOURS,
            },
            [TitleCategory.UPCOMING]: {
                maxPages:
                    this.configService.get<number>('tmdb.maxUpcomingPages') ||
                    3,
                syncInterval:
                    this.configService.get<number>('sync.upcomingInterval') ||
                    24,
                cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
            },
            [TitleCategory.REGULAR]: {
                maxPages: 1,
                syncInterval:
                    this.configService.get<number>('sync.regularInterval') ||
                    24,
                cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
            },
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async syncPopularTitles(): Promise<boolean> {
        if (await this.shouldSyncCategory(TitleCategory.POPULAR)) {
            await this.titleSyncQueueService.addSyncJob(TitleCategory.POPULAR)
            return true
        }
        return false
    }

    @Cron(CronExpression.EVERY_12_HOURS)
    async syncAiringTitles(): Promise<boolean> {
        if (await this.shouldSyncCategory(TitleCategory.AIRING)) {
            await this.titleSyncQueueService.addSyncJob(TitleCategory.AIRING)
            return true
        }
        return false
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async syncTopRatedTitles(): Promise<boolean> {
        if (await this.shouldSyncCategory(TitleCategory.TOP_RATED)) {
            await this.titleSyncQueueService.addSyncJob(TitleCategory.TOP_RATED)
            return true
        }
        return false
    }

    async syncTitlesByCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<number> {
        this.logger.log(
            `Starting sync for category: ${category}, page: ${page}`,
        )

        try {
            const { movieData, tvData } =
                await this.titleFetcherService.fetchByCategory(category, page)

            if (
                (!movieData?.results?.length && !tvData?.results?.length) ||
                (movieData?.total_pages === 0 && tvData?.total_pages === 0)
            ) {
                this.logger.warn(
                    `No results found for category: ${category}, page: ${page}`,
                )
                return 0
            }

            const processedMovies = await this.processTmdbResults(
                movieData?.results || [],
                TitleType.MOVIE,
                category,
            )
            const processedTvShows = await this.processTmdbResults(
                tvData?.results || [],
                TitleType.TV,
                category,
            )

            const totalProcessed =
                processedMovies.length + processedTvShows.length

            const maxPages = this.categoryConfigs[category].maxPages
            const hasMorePages =
                (movieData?.total_pages > page || tvData?.total_pages > page) &&
                page < maxPages

            if (hasMorePages) {
                await this.titleSyncQueueService.addSyncJob(
                    category,
                    page + 1,
                    5000,
                )
            }

            return totalProcessed
        } catch (error) {
            this.logger.warn(
                `Failed to sync titles for category ${category}: ${error.message}`,
            )
            throw error
        }
    }

    private async shouldSyncCategory(
        category: TitleCategory,
    ): Promise<boolean> {
        const config = this.categoryConfigs[category]
        const lastSync =
            await this.titleCacheService.getCategoryLastSync(category)

        if (!lastSync) return true

        const hoursSinceLastSync =
            (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
        return hoursSinceLastSync >= config.syncInterval
    }

    private async processTmdbResults(
        results: TmdbTitleResponse[],
        type: TitleType,
        category: TitleCategory,
    ): Promise<string[]> {
        const tasks = results.map(async (result) => {
            try {
                const existingTitle = await this.titleService.findByTmdbId(
                    String(result.id),
                )

                if (existingTitle) {
                    const detailedInfo =
                        await this.titleFetcherService.fetchTitleDetails(
                            String(result.id),
                            type,
                        )

                    if (!detailedInfo) return existingTitle.id

                    const imdbId = detailedInfo.external_ids.imdb_id

                    const cachedDetails =
                        await this.titleCacheService.getDetails(
                            existingTitle.id,
                            category,
                        )

                    const titleChanged =
                        this.titleChangeDetectorService.isTitleChanged(
                            cachedDetails,
                            detailedInfo,
                        )

                    if (titleChanged) {
                        await this.titleService.updateTitleFromTmdb(
                            existingTitle,
                            result,
                            detailedInfo,
                            type,
                            category,
                            imdbId,
                        )

                        await Promise.all([
                            this.titleRelationService.updateTitleRelations(
                                existingTitle.id,
                                detailedInfo,
                            ),
                            this.titleCacheService.storeDetailedInfoInRedis(
                                existingTitle.id,
                                detailedInfo,
                                category,
                            ),
                        ])
                    } else {
                        await this.titleCacheService.extendTitleTTL(
                            existingTitle.id,
                            category,
                        )
                    }

                    if (imdbId) {
                        await this.titleSyncQueueService.addLocationSyncJob(
                            existingTitle.id,
                            imdbId,
                            category,
                        )
                    }

                    return existingTitle.id
                } else {
                    const detailedInfo =
                        await this.titleFetcherService.fetchTitleDetails(
                            String(result.id),
                            type,
                        )

                    if (!detailedInfo) return null

                    const imdbId = detailedInfo.external_ids.imdb_id ?? null

                    const titleId = await this.titleService.createTitleFromTmdb(
                        result,
                        detailedInfo,
                        type,
                        category,
                        imdbId,
                    )

                    if (titleId) {
                        await Promise.all([
                            this.titleRelationService.createTitleRelations(
                                titleId,
                                detailedInfo,
                            ),
                            this.titleCacheService.storeDetailedInfoInRedis(
                                titleId,
                                detailedInfo,
                                category,
                            ),
                            imdbId
                                ? this.titleSyncQueueService.addLocationSyncJob(
                                      titleId,
                                      imdbId,
                                      category,
                                  )
                                : Promise.resolve(),
                        ])
                    }

                    return titleId
                }
            } catch (error) {
                this.logger.warn(
                    `Failed to process TMDB result ID ${result.id}: ${error.message}`,
                )
                return null
            }
        })

        const processedIds = (await Promise.all(tasks)).filter(
            (id) => id !== null && id !== undefined,
        )

        return processedIds
    }

    async cleanup(): Promise<boolean> {
        this.logger.warn(
            'Starting cleanup process: deleting all titles and relations, and clearing Redis.',
        )

        try {
            this.logger.debug('Deleting title relations...')
            await this.titleRelationService.deleteAllRelations()
            this.logger.debug('Title relations deleted.')

            this.logger.debug('Deleting all titles...')
            await this.titleService.deleteAllTitles()
            this.logger.debug('All titles deleted.')

            this.logger.debug('Clearing Redis...')
            await this.titleCacheService.clearAllTitlesCache()
            this.logger.debug('Redis cleared.')

            this.logger.debug('Cleaning up queues...')
            await this.titleSyncQueueService.cleanUpQueues()

            this.logger.warn('Cleanup process completed successfully.')

            return true
        } catch (error) {
            this.logger.warn(`Cleanup process failed: ${error.message}`)
            throw error
        }
    }
}
