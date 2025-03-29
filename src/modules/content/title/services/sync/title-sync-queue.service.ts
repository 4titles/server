import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job, JobsOptions, Queue } from 'bullmq'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleSyncSource } from '../../enums/title-sync-source.enum'
import { TitleType } from '../../enums/title-type.enum'
import {
    CategorySyncJobData,
    LocationSyncJobData,
    TitleSyncJobData,
} from '../../types/sync-job.interface'

@Injectable()
export class TitleSyncQueueService {
    private readonly logger: Logger = new Logger(TitleSyncQueueService.name)

    private DEFAULT_QUEUE_OPTIONS: JobsOptions = {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute in ms
        },
    }

    private TITLE_SYNC_OPTIONS: JobsOptions = {
        ...this.DEFAULT_QUEUE_OPTIONS,
        priority: 10,
    }

    private LOCATION_SYNC_OPTIONS: JobsOptions = {
        ...this.DEFAULT_QUEUE_OPTIONS,
        priority: 5,
    }

    constructor(
        @InjectQueue('title-sync')
        private readonly titleSyncQueue: Queue,
        @InjectQueue('title-location-sync')
        private readonly titleLocationSyncQueue: Queue,
    ) {}

    async addCategorySyncJob(
        category: TitleCategory,
        page: number = 1,
        delay: number = 0,
    ): Promise<void> {
        const jobData: CategorySyncJobData = { category, page }
        const jobId = `category-${category}-page-${page}`
        await this.titleSyncQueue.add('sync-category', jobData, {
            jobId,
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        })
        this.logger.debug(
            `Added category sync job [${jobId}] for category: ${category}, page: ${page}`,
        )
    }

    async addTitleSyncJob(
        tmdbId: string,
        type: TitleType,
        category?: TitleCategory,
        source: TitleSyncSource = TitleSyncSource.CATEGORY,
    ): Promise<void> {
        const jobData: TitleSyncJobData = { tmdbId, type, category, source }
        const jobId = `title-${type}-${tmdbId}`
        await this.titleSyncQueue.add('sync-title', jobData, {
            jobId,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 50,
        })
        this.logger.debug(
            `Added title sync job [${jobId}] for tmdbId: ${tmdbId}, type: ${type}, source: ${source}, category: ${category}`,
        )
    }

    async addLocationSyncJob(
        titleId: string,
        imdbId: string,
        category: TitleCategory,
    ): Promise<void> {
        const jobData: LocationSyncJobData = { titleId, imdbId, category }
        const jobId = `location-${titleId}`
        await this.titleLocationSyncQueue.add('sync-location', jobData, {
            jobId,
            attempts: 2,
            backoff: { type: 'exponential', delay: 10000 },
            removeOnComplete: true,
            removeOnFail: 50,
        })
        this.logger.debug(
            `Added location sync job [${jobId}] for titleId: ${titleId}, imdbId: ${imdbId}`,
        )
    }

    async getQueueStatus(
        queueName: 'title-sync' | 'title-location-sync',
    ): Promise<{
        waiting: number
        active: number
        completed: number
        failed: number
        delayed: number
        paused: number
    }> {
        const queue =
            queueName === 'title-sync'
                ? this.titleSyncQueue
                : this.titleLocationSyncQueue
        const counts = await queue.getJobCounts()

        return {
            waiting: counts.waiting,
            active: counts.active,
            completed: counts.completed,
            failed: counts.failed,
            delayed: counts.delayed,
            paused: counts.paused,
        }
    }

    async getFailedJobs(
        queueName: 'title-sync' | 'title-location-sync',
    ): Promise<Job[]> {
        const queue =
            queueName === 'title-sync'
                ? this.titleSyncQueue
                : this.titleLocationSyncQueue
        return queue.getFailed(0, 1000)
    }

    async cleanUpQueues(): Promise<void> {
        this.logger.log(
            'Cleaning up title-sync and title-location-sync queues...',
        )
        await Promise.all([
            this.titleSyncQueue.obliterate({ force: true }),
            this.titleLocationSyncQueue.obliterate({ force: true }),
        ])
        this.logger.log('Queues obliterated.')
    }
}
