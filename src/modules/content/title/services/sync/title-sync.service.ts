import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import {
    defaultTitleSyncConfig,
    TitleSyncConfig,
} from '../../config/title-sync.config'
import { TmdbTitleDataDTO } from '../../dto/tmdb-title-data.dto'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleSyncStatus } from '../../enums/title-sync-status.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TitleSyncResult } from '../../models/title-sync-result.model'
import { TmdbTitleResponse } from '../../modules/tmdb/types/tmdb.interface'
import { TitleCacheService } from '../cache/title-cache.service'
import { TitleRelationService } from '../relations/title-relation.service'
import { TitleService } from '../title.service'
import { TitleFetcherService } from '../utils/title-fetcher.service'
import { TitleTransformService } from '../utils/title-transform.service'
import { TitleElasticsearchSyncService } from './title-elasticsearch-sync.service'
import { TitleSyncQueueService } from './title-sync-queue.service'

@Injectable()
export class TitleSyncService {
    private readonly logger = new Logger(TitleSyncService.name)
    private readonly titleSyncConfig: TitleSyncConfig = defaultTitleSyncConfig

    constructor(
        private readonly titleSyncQueueService: TitleSyncQueueService,
        private readonly titleCacheService: TitleCacheService,
        private readonly titleRelationService: TitleRelationService,
        private readonly titleFetcherService: TitleFetcherService,
        private readonly titleService: TitleService,
        private readonly titleTransformService: TitleTransformService,
        private readonly titleElasticsearchSyncService: TitleElasticsearchSyncService,
    ) {}

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.POPULAR])
    async syncPopularTitles(): Promise<TitleSyncResult> {
        try {
            this.logger.warn('Starting popular titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.POPULAR,
            )
            return await this.titleCacheService.getCategorySyncResult(
                TitleCategory.POPULAR,
            )
        } catch (error) {
            this.logger.fatal('Failed to start popular titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.TOP_RATED])
    async syncTopRatedTitles(): Promise<TitleSyncResult> {
        try {
            this.logger.warn('Starting top rated titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.TOP_RATED,
            )
            return await this.titleCacheService.getCategorySyncResult(
                TitleCategory.TOP_RATED,
            )
        } catch (error) {
            this.logger.fatal('Failed to start top rated titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.TRENDING])
    async syncTrendingTitles(): Promise<TitleSyncResult> {
        try {
            this.logger.warn('Starting trending titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.TRENDING,
            )
            return await this.titleCacheService.getCategorySyncResult(
                TitleCategory.TRENDING,
            )
        } catch (error) {
            this.logger.fatal('Failed to start trending titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.UPCOMING])
    async syncUpcomingTitles(): Promise<TitleSyncResult> {
        try {
            this.logger.warn('Starting upcoming titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.UPCOMING,
            )
            return await this.titleCacheService.getCategorySyncResult(
                TitleCategory.UPCOMING,
            )
        } catch (error) {
            this.logger.fatal('Failed to start upcoming titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.AIRING])
    async syncAiringTitles(): Promise<TitleSyncResult> {
        try {
            this.logger.warn('Starting airing titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.AIRING,
            )
            return await this.titleCacheService.getCategorySyncResult(
                TitleCategory.AIRING,
            )
        } catch (error) {
            this.logger.fatal('Failed to start airing titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.REGULAR])
    async checkRegularTitlesChanges(): Promise<void> {
        try {
            this.logger.log('Starting regular titles changes check')
            const regularTitles = await this.titleService.findAll({
                category: TitleCategory.REGULAR,
            })

            for (const title of regularTitles) {
                await this.checkTitleChanges(title.tmdbId, title.type)
            }
        } catch (error) {
            this.logger.error('Failed to check regular titles changes:', error)
            throw error
        }
    }

    async syncAll(): Promise<Record<TitleCategory, TitleSyncResult>> {
        try {
            this.logger.warn('Starting sync for all categories')
            const categories = Object.values(TitleCategory)

            for (const category of categories) {
                if (category === TitleCategory.REGULAR) continue
                this.logger.debug(`Adding sync job for category: ${category}`)
                await this.titleSyncQueueService.addCategorySyncJob(category, 1)
            }

            this.logger.warn('All category sync jobs have been added to queue')
            return await this.titleCacheService.getSyncResults()
        } catch (error) {
            this.logger.fatal('Failed to start sync for all categories:', error)
            throw error
        }
    }

    async syncCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<TitleSyncResult> {
        try {
            this.logger.log(
                `Starting sync for category: ${category}, page: ${page}`,
            )
            const limit = this.titleSyncConfig.limits[category]

            const { movieData, tvData } =
                await this.titleFetcherService.fetchByCategory(category, page)

            if (!movieData?.results?.length && !tvData?.results?.length) {
                this.logger.warn(
                    `No results found for category: ${category}, page: ${page}`,
                )
                return {
                    status: TitleSyncStatus.SUCCESS,
                    timestamp: new Date(),
                    total: 0,
                    processed: 0,
                    failed: [],
                }
            }

            const previousResult =
                await this.titleCacheService.getCategorySyncResult(category)
            const previousProcessed = previousResult?.processed || 0
            const remainingLimit = limit - previousProcessed

            if (remainingLimit <= 0) {
                this.logger.log(
                    `Limit reached for category: ${category}, stopping sync`,
                )
                return previousResult
            }

            const total =
                (movieData?.results?.length || 0) +
                (tvData?.results?.length || 0)
            const failed: string[] = []
            let processedCount = 0

            for (const movie of movieData.results) {
                if (processedCount >= remainingLimit) break
                try {
                    await this.syncTitle(movie, TitleType.MOVIE, category)
                    processedCount++
                } catch (error) {
                    failed.push(String(movie.id))
                    this.logger.error(
                        `Failed to sync movie ${movie.id}:`,
                        error.stack,
                    )
                }
            }

            for (const tv of tvData.results) {
                if (processedCount >= remainingLimit) break
                try {
                    await this.syncTitle(tv, TitleType.TV, category)
                    processedCount++
                } catch (error) {
                    failed.push(String(tv.id))
                    this.logger.error(
                        `Failed to sync tv show ${tv.id}:`,
                        error.stack,
                    )
                }
            }

            const newProcessed = previousProcessed + processedCount

            const result: TitleSyncResult = {
                status:
                    failed.length === 0
                        ? TitleSyncStatus.SUCCESS
                        : failed.length === total
                          ? TitleSyncStatus.FAILED
                          : TitleSyncStatus.PARTIAL,
                timestamp: new Date(),
                total: newProcessed,
                processed: newProcessed,
                failed: [...(previousResult?.failed || []), ...failed],
            }

            await this.titleCacheService.storeCategorySyncResult(
                category,
                result,
            )

            const hasMorePages =
                newProcessed < limit &&
                (movieData?.total_pages > page || tvData?.total_pages > page)

            if (hasMorePages) {
                const remainingToProcess = limit - newProcessed

                if (remainingToProcess > 0) {
                    this.logger.log(
                        `Adding next page for category: ${category}, remaining to process: ${remainingToProcess}`,
                    )
                    await this.titleSyncQueueService.addCategorySyncJob(
                        category,
                        page + 1,
                        3000,
                    )
                } else {
                    this.logger.log(
                        `Limit reached for category: ${category}, stopping sync`,
                    )
                }
            }

            return result
        } catch (error) {
            this.logger.fatal(`Failed to sync category ${category}:`, error)
            const failedResult: TitleSyncResult = {
                status: TitleSyncStatus.FAILED,
                timestamp: new Date(),
                total: 0,
                processed: 0,
                failed: [],
                error: error.message,
            }
            await this.titleCacheService.storeCategorySyncResult(
                category,
                failedResult,
            )
            return failedResult
        }
    }

    async syncTitle(
        titleToSync: TmdbTitleResponse,
        type: TitleType,
        category: TitleCategory,
    ): Promise<void> {
        try {
            const tmdbId = String(titleToSync.id)
            const titleDetails =
                await this.titleFetcherService.fetchTitleDetails(tmdbId, type)

            if (!titleDetails) throw new Error('No title details retrived')

            const imdbId = titleDetails.external_ids.imdb_id

            const existingTitle = await this.titleService.findByTmdbId(tmdbId)
            const titleData: TmdbTitleDataDTO = {
                title: titleToSync,
                titleDetails,
                type,
                category,
                imdbId,
                existingTitle,
            }

            let titleId: string
            if (existingTitle) {
                const titleUpdate =
                    this.titleTransformService.createTitleUpdateDataFromTmdbResults(
                        titleData,
                    )

                await this.titleService.updateFromTmdb(titleUpdate)
                titleId = existingTitle.id

                await this.titleRelationService.updateTitleRelations(
                    titleId,
                    titleDetails,
                )

                await this.titleElasticsearchSyncService.updateTitleInElasticsearch(
                    titleId,
                    titleData,
                )
            } else {
                const newTitleData =
                    this.titleTransformService.createTitleDataFromTmdbResults(
                        titleData,
                    )

                const newTitle =
                    await this.titleService.createFromTmdb(newTitleData)
                titleId = newTitle.id

                await this.titleRelationService.createTitleRelations(
                    titleId,
                    titleDetails,
                )

                await this.titleElasticsearchSyncService.syncTitleWithElasticsearch(
                    titleId,
                    titleData,
                )
            }

            if (imdbId) {
                await this.titleSyncQueueService.addLocationSyncJob(
                    titleId,
                    imdbId,
                    category,
                )
            }
        } catch (error) {
            this.logger.warn(
                `Failed to sync title ${titleToSync.id}:`,
                error.stack,
            )
            throw error
        }
    }

    private async checkTitleChanges(
        tmdbId: string,
        type: TitleType,
    ): Promise<void> {
        try {
            const changes = await this.titleFetcherService.getTitleChanges(
                tmdbId,
                type,
            )
            if (!changes || Array(changes).length === 0) return

            const title = await this.titleService.findByTmdbId(tmdbId)
            if (!title) return

            await this.titleService.updateFromTmdb({
                tmdbId,
                lastChangesCheck: new Date(),
            })

            const titleDetails =
                await this.titleFetcherService.fetchTitleDetails(tmdbId, type)
            await this.syncTitle(titleDetails, type, title.category)
        } catch (error) {
            this.logger.error(
                `Failed to check changes for title ${tmdbId}:`,
                error,
            )
        }
    }

    async cleanup(): Promise<boolean> {
        this.logger.log(
            'Starting cleanup process: deleting all titles and relations, and clearing Redis and ElasticSearch.',
        )

        try {
            this.logger.debug('Deleting title relations...')
            await this.titleRelationService.deleteAllRelations()
            this.logger.debug('Title relations deleted.')

            this.logger.debug(
                'Getting all title IDs for ElasticSearch cleanup...',
            )
            const allTitles = await this.titleService.findAll()

            this.logger.debug('Deleting all titles from PostgreSQL...')
            await this.titleService.deleteAllTitles()
            this.logger.debug('All titles deleted from PostgreSQL.')

            this.logger.debug('Deleting titles from ElasticSearch...')
            for (const title of allTitles) {
                await this.titleElasticsearchSyncService.deleteTitleFromElasticsearch(
                    title.id,
                )
            }
            this.logger.debug('Titles deleted from ElasticSearch.')

            this.logger.debug('Clearing Redis...')
            await this.titleCacheService.clearAllTitlesCache()
            this.logger.debug('Redis cleared.')

            this.logger.debug('Cleaning up queues...')
            await this.titleSyncQueueService.cleanUpQueues()

            this.logger.log('Cleanup process completed successfully.')

            return true
        } catch (error) {
            this.logger.error(`Cleanup process failed: ${error.message}`)
            throw error
        }
    }
}
