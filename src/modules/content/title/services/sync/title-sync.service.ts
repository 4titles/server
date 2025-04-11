import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import {
    defaultTitleSyncConfig,
    TitleSyncConfig,
} from '../../config/title-sync.config'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleSyncSource } from '../../enums/title-sync-source.enum'
import { TitleSyncTimestamp } from '../../enums/title-sync-timestamp.enum'
import { TitleType } from '../../enums/title-type.enum'
import { TitleSyncData } from '../../types/title-sync-data.interface'
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
    async syncPopularTitles(): Promise<void> {
        try {
            this.logger.warn('Starting popular titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.POPULAR,
            )
            await this.titleCacheService.setCategorySyncTimestamp(
                TitleCategory.POPULAR,
                TitleSyncTimestamp.START,
            )
        } catch (error) {
            this.logger.fatal('Failed to start popular titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.TOP_RATED])
    async syncTopRatedTitles(): Promise<void> {
        try {
            this.logger.warn('Starting top rated titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.TOP_RATED,
            )
            await this.titleCacheService.setCategorySyncTimestamp(
                TitleCategory.TOP_RATED,
                TitleSyncTimestamp.START,
            )
        } catch (error) {
            this.logger.fatal('Failed to start top rated titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.TRENDING])
    async syncTrendingTitles(): Promise<void> {
        try {
            this.logger.warn('Starting trending titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.TRENDING,
            )
            await this.titleCacheService.setCategorySyncTimestamp(
                TitleCategory.TRENDING,
                TitleSyncTimestamp.START,
            )
        } catch (error) {
            this.logger.fatal('Failed to start trending titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.UPCOMING])
    async syncUpcomingTitles(): Promise<void> {
        try {
            this.logger.warn('Starting upcoming titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.UPCOMING,
            )
            await this.titleCacheService.setCategorySyncTimestamp(
                TitleCategory.UPCOMING,
                TitleSyncTimestamp.START,
            )
        } catch (error) {
            this.logger.fatal('Failed to start upcoming titles sync: ', error)
            throw error
        }
    }

    @Cron(defaultTitleSyncConfig.cronExpressions[TitleCategory.AIRING])
    async syncAiringTitles(): Promise<void> {
        try {
            this.logger.warn('Starting airing titles sync')
            await this.titleSyncQueueService.addCategorySyncJob(
                TitleCategory.AIRING,
            )
            await this.titleCacheService.setCategorySyncTimestamp(
                TitleCategory.AIRING,
                TitleSyncTimestamp.START,
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

            const checkPromises = regularTitles.map((title) => {
                let startDate: Date
                if (title.lastSyncedAt) {
                    startDate = title.lastSyncedAt
                    this.logger.debug(
                        `Using lastSyncedAt ${startDate.toISOString()} as start date for title ${title.tmdbId}`,
                    )
                } else {
                    startDate = new Date()
                    startDate.setDate(startDate.getDate() - 7)
                    this.logger.debug(
                        `No lastSyncedAt found for title ${title.tmdbId}. Using fallback start date: ${startDate.toISOString()}`,
                    )
                }

                return this.checkTitleChanges(
                    title.tmdbId,
                    title.type,
                    startDate,
                    new Date(),
                )
            })
            await Promise.all(checkPromises)
            this.logger.log(
                `Initiated change checks for ${regularTitles.length} regular titles.`,
            )
        } catch (error) {
            this.logger.error('Failed to check regular titles changes:', error)
        }
    }

    async syncAll(): Promise<boolean> {
        try {
            this.logger.warn('Starting sync for all categories')
            const categories = Object.values(TitleCategory)

            for (const category of categories) {
                if (category === TitleCategory.REGULAR) continue
                this.logger.debug(`Adding sync job for category: ${category}`)
                await this.titleCacheService.startCategorySyncTracking(category)
                await this.titleSyncQueueService.addCategorySyncJob(category, 1)
                await this.titleCacheService.setCategorySyncTimestamp(
                    category,
                    TitleSyncTimestamp.START,
                )
            }

            this.logger.warn('All category sync jobs have been added to queue')
            await this.titleCacheService.invalidateTitlesListCache()
            return true
        } catch (error) {
            this.logger.fatal('Failed to start sync for all categories:', error)
            const categories = Object.values(TitleCategory).filter(
                (c) => c !== TitleCategory.REGULAR,
            )
            for (const category of categories) {
                await this.titleCacheService
                    .finishCategorySyncTracking(category)
                    .catch((e) =>
                        this.logger.error(
                            `Failed cleanup tracking for ${category} after syncAll error: ${e.message}`,
                        ),
                    )
            }
            throw error
        }
    }

    async syncCategory(
        category: TitleCategory,
        page: number = 1,
    ): Promise<void> {
        try {
            this.logger.log(
                `Syncing category: ${category}, page: ${page}. Fetching titles...`,
            )
            if (page === 1) {
                await this.titleCacheService.startCategorySyncTracking(category)
                await this.titleCacheService.setCategorySyncTimestamp(
                    category,
                    TitleSyncTimestamp.START,
                )
            }

            const { movieData, tvData } =
                await this.titleFetcherService.fetchByCategory(category, page)

            const movieResults = movieData?.results || []
            const tvResults = tvData?.results || []

            const fetchedTmdbIds = [
                ...movieResults.map((m) => String(m.id)),
                ...tvResults.map((t) => String(t.id)),
            ]
            if (fetchedTmdbIds.length > 0) {
                await this.titleCacheService.addActiveTitleIds(
                    category,
                    fetchedTmdbIds,
                )
            }

            if (fetchedTmdbIds.length === 0 && page === 1) {
                this.logger.warn(
                    `No results found for category: ${category}, page: ${page}. Finishing sync early.`,
                )
                await this.handleEndOfCategorySync(category)
                return
            }

            const limit = this.titleSyncConfig.limits[category]
            if (!limit)
                throw new Error(`No limit specified for category: ${category}`)

            const itemsPerPage = fetchedTmdbIds.length
            let processedCount = (page - 1) * itemsPerPage

            const syncPromises: Promise<void>[] = []

            for (const movie of movieResults) {
                if (processedCount >= limit) break
                syncPromises.push(
                    this.titleSyncQueueService.addTitleSyncJob(
                        String(movie.id),
                        TitleType.MOVIE,
                        category,
                        TitleSyncSource.CATEGORY,
                    ),
                )
                processedCount++
            }

            for (const tv of tvResults) {
                if (processedCount >= limit) break
                syncPromises.push(
                    this.titleSyncQueueService.addTitleSyncJob(
                        String(tv.id),
                        TitleType.TV,
                        category,
                        TitleSyncSource.CATEGORY,
                    ),
                )
                processedCount++
            }

            await Promise.all(syncPromises)
            this.logger.log(
                `Added ${syncPromises.length} title sync jobs for category: ${category}, page: ${page}.`,
            )

            const hasMoreMovies = movieData?.total_pages > page
            const hasMoreTv = tvData?.total_pages > page
            const hasMorePages =
                (hasMoreMovies || hasMoreTv) && processedCount < limit

            if (hasMorePages) {
                this.logger.log(
                    `Queueing next page for category: ${category}. Next page: ${page + 1}, Processed so far: ${processedCount}, Limit: ${limit}`,
                )
                await this.titleSyncQueueService.addCategorySyncJob(
                    category,
                    page + 1,
                    1000,
                )
            } else {
                this.logger.log(
                    `Finished processing category: ${category}. Reached limit or no more pages. Processed: ${processedCount}, Limit: ${limit}, Last Movie Page: ${movieData?.total_pages}, Last TV Page: ${tvData?.total_pages}`,
                )
                await this.handleEndOfCategorySync(category)
            }
        } catch (error) {
            this.logger.fatal(
                `Failed to sync category ${category}, page: ${page}:`,
                error.stack,
            )
            await this.handleEndOfCategorySync(category, true)
        }
    }

    private async handleEndOfCategorySync(
        category: TitleCategory,
        isError: boolean = false,
    ): Promise<void> {
        try {
            await this.titleCacheService.setCategorySyncTimestamp(
                category,
                TitleSyncTimestamp.END,
            )

            if (!isError) {
                this.logger.log(
                    `Comparing active titles for ${category} to update REGULAR status.`,
                )
                const activeTmdbIdsSet =
                    await this.titleCacheService.getActiveTitleIds(category)
                this.logger.debug(
                    `Retrieved ${activeTmdbIdsSet.size} active TMDB IDs from cache for ${category}.`,
                )

                if (activeTmdbIdsSet.size > 0) {
                    const titlesCurrentlyInCategory =
                        await this.titleService.findByCategory(category)
                    this.logger.debug(
                        `Found ${titlesCurrentlyInCategory.length} titles currently marked as ${category} in DB.`,
                    )

                    const titlesToUpdateToRegular = titlesCurrentlyInCategory
                        .filter((title) => !activeTmdbIdsSet.has(title.tmdbId))
                        .map((title) => title.id)

                    if (titlesToUpdateToRegular.length > 0) {
                        this.logger.log(
                            `Found ${titlesToUpdateToRegular.length} titles to move from ${category} to REGULAR.`,
                        )
                        try {
                            const updatedCount =
                                await this.titleService.updateCategoryForTitles(
                                    titlesToUpdateToRegular,
                                    TitleCategory.REGULAR,
                                )
                            this.logger.log(
                                `Successfully updated ${updatedCount} titles to REGULAR.`,
                            )
                        } catch (updateError) {
                            this.logger.error(
                                `Failed to update titles to REGULAR for category ${category}:`,
                                updateError,
                            )
                        }
                    } else {
                        this.logger.log(
                            `No titles need to be moved from ${category} to REGULAR.`,
                        )
                    }
                } else {
                    this.logger.warn(
                        `Active ID set for category ${category} was empty. Skipping REGULAR update check.`,
                    )
                }
            }
        } catch (error) {
            this.logger.error(
                `Error during end-of-sync handling for category ${category}:`,
                error,
            )
        } finally {
            await this.titleCacheService.finishCategorySyncTracking(category)
        }
    }

    async syncTitle(
        tmdbId: string,
        type: TitleType,
        category: TitleCategory,
        source: TitleSyncSource,
    ): Promise<void> {
        try {
            this.logger.debug(
                `Starting sync for title ${tmdbId} (${type}) from source: ${source}, category context: ${category}`,
            )

            const titleDetails =
                await this.titleFetcherService.fetchTitleDetails(tmdbId, type)

            if (!titleDetails) {
                this.logger.warn(
                    `No title details retrieved for TMDB ID: ${tmdbId}. Skipping sync.`,
                )
                return
            }

            const basicTitleInfo =
                this.titleTransformService.extractBasicTitleInfo(titleDetails)
            const imdbId = titleDetails.external_ids?.imdb_id
            const existingTitle = await this.titleService.findByTmdbId(tmdbId)

            const finalCategory =
                source === TitleSyncSource.CATEGORY
                    ? category
                    : existingTitle?.category || TitleCategory.REGULAR

            const titleData: TitleSyncData = {
                title: basicTitleInfo,
                titleDetails,
                type,
                category: finalCategory,
                imdbId,
                existingTitle,
            }

            let titleId: string
            if (existingTitle) {
                this.logger.debug(
                    `Title ${tmdbId} exists (ID: ${existingTitle.id}). Updating...`,
                )
                const titleUpdate =
                    this.titleTransformService.createTitleUpdateDataFromTmdbResults(
                        titleData,
                    )

                if (source === TitleSyncSource.CATEGORY) {
                    titleUpdate.category = category
                } else {
                    delete titleUpdate.category
                }

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
                this.logger.debug(
                    `Title ${tmdbId} updated successfully (Source: ${source}).`,
                )
            } else {
                this.logger.debug(`Title ${tmdbId} does not exist. Creating...`)
                const newTitleData =
                    this.titleTransformService.createTitleDataFromTmdbResults(
                        titleData,
                    )

                newTitleData.category = finalCategory
                newTitleData.lastSyncedAt = new Date()

                const newTitle =
                    await this.titleService.createFromTmdb(newTitleData)
                titleId = newTitle.id
                this.logger.debug(
                    `Title ${tmdbId} created with ID: ${titleId}, Category: ${finalCategory}. Creating relations...`,
                )

                await this.titleRelationService.createTitleRelations(
                    titleId,
                    titleDetails,
                )
                this.logger.debug(
                    `Relations created for title ${titleId}. Syncing with ElasticSearch...`,
                )

                await this.titleElasticsearchSyncService.syncTitleWithElasticsearch(
                    titleId,
                    titleData,
                )
                this.logger.debug(`Title ${titleId} synced with ElasticSearch.`)
            }

            if (imdbId) {
                this.logger.debug(
                    `Adding location sync job for title ${titleId} (IMDB: ${imdbId})`,
                )
                await this.titleSyncQueueService.addLocationSyncJob(
                    titleId,
                    imdbId,
                    finalCategory,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to sync title ${tmdbId} (${type}) from source ${source}:`,
                error.stack,
            )
        }
    }

    private async checkTitleChanges(
        tmdbId: string,
        type: TitleType,
        startDate: Date,
        endDate: Date,
    ): Promise<void> {
        try {
            const changes = await this.titleFetcherService.getTitleChanges(
                tmdbId,
                type,
                startDate,
                endDate,
            )
            if (!changes || changes.length === 0) {
                this.logger.debug(
                    `No changes detected for title ${tmdbId} since ${startDate.toISOString()}.`,
                )

                const title = await this.titleService.findByTmdbId(tmdbId)
                if (title && title.imdbId) {
                    await this.titleSyncQueueService.addLocationSyncJob(
                        title.id,
                        title.imdbId,
                        title.category,
                    )
                }
                return
            }

            this.logger.log(
                `Changes detected for title ${tmdbId} since ${startDate.toISOString()}. Triggering sync. Changes: ${JSON.stringify(changes)}`,
            )
            const title = await this.titleService.findByTmdbId(tmdbId)
            if (!title) {
                this.logger.error(
                    `Cannot sync changes for non-existent title ${tmdbId}. It might have been deleted.`,
                )
                return
            }

            await this.titleSyncQueueService.addTitleSyncJob(
                tmdbId,
                type,
                title.category,
                TitleSyncSource.CHECK,
            )
        } catch (error) {
            this.logger.error(
                `Failed to check/trigger sync for changes for title ${tmdbId}:`,
                error.stack,
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
            const deletePromises = allTitles.map((title) =>
                this.titleElasticsearchSyncService.deleteTitleFromElasticsearch(
                    title.id,
                ),
            )
            await Promise.all(deletePromises)
            this.logger.debug('Titles deleted from ElasticSearch.')

            this.logger.debug('Clearing Redis...')
            await this.titleCacheService.clearAllTitlesCache()
            this.logger.debug('Redis cleared.')

            this.logger.debug('Cleaning up queues...')
            await this.titleSyncQueueService.cleanUpQueues()
            this.logger.log('Cleanup queues finished.')

            this.logger.log('Cleanup process completed successfully.')
            await this.titleCacheService.invalidateTitlesListCache()
            return true
        } catch (error) {
            this.logger.error(
                `Cleanup process failed: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
