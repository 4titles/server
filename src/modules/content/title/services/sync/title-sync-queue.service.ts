import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job, JobsOptions, Queue } from 'bullmq'
import { TitleCategory } from '../../enums/title-category.enum'

interface JobData {
    category: TitleCategory
    page?: number
}

interface LocationJobData {
    titleId: string
    imdbId: string
    category: TitleCategory
}

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

    private LOCATION_SYNC_OPTIONS: JobsOptions = {
        ...this.DEFAULT_QUEUE_OPTIONS,
        priority: 5,
    }

    constructor(
        @InjectQueue('title-sync') private readonly titleSyncQueue: Queue,
        @InjectQueue('title-location-sync')
        private readonly locationSyncQueue: Queue,
    ) {}

    async addCategorySyncJob(
        category: TitleCategory,
        page: number = 1,
        delay: number = 0,
    ): Promise<void> {
        await this.addJob(
            this.titleSyncQueue,
            'sync-category',
            { category, page },
            { ...this.DEFAULT_QUEUE_OPTIONS, delay },
        )
        this.logger.debug(
            `Added category sync job for category: ${category}, page: ${page}`,
        )
    }

    async addLocationSyncJob(
        titleId: string,
        imdbId: string,
        category: TitleCategory,
    ): Promise<void> {
        await this.addJob(
            this.locationSyncQueue,
            'sync-locations',
            { titleId, imdbId, category } as LocationJobData,
            this.LOCATION_SYNC_OPTIONS,
        )
        this.logger.debug(
            `Added location sync job for titleId: ${titleId}, imdbId: ${imdbId}`,
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
    }> {
        const queue =
            queueName === 'title-sync'
                ? this.titleSyncQueue
                : this.locationSyncQueue
        const [waiting, active, completed, failed, delayed] = await Promise.all(
            [
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
            ],
        )

        return { waiting, active, completed, failed, delayed }
    }

    async getFailedJobs(
        queueName: 'title-sync' | 'title-location-sync',
    ): Promise<Job[]> {
        const queue =
            queueName === 'title-sync'
                ? this.titleSyncQueue
                : this.locationSyncQueue
        return queue.getFailed()
    }

    async cleanUpQueues(category?: TitleCategory): Promise<void> {
        await Promise.all([
            this.cleanUpQueue(this.titleSyncQueue, category),
            this.cleanUpQueue(this.locationSyncQueue, category),
        ])
    }

    private async addJob(
        queue: Queue,
        name: string,
        data: JobData,
        options: JobsOptions,
    ): Promise<void> {
        try {
            await queue.add(name, data, options)
        } catch (error) {
            this.logger.error(
                `Failed to add job to queue ${queue.name}: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    private async cleanUpQueue(
        queue: Queue,
        category?: TitleCategory,
    ): Promise<void> {
        try {
            const jobs = await queue.getJobs([
                'waiting',
                'delayed',
                'active',
                'failed',
            ])
            const jobsToRemove = category
                ? jobs.filter((job) => job.data.category === category)
                : jobs

            if (jobsToRemove.length > 0) {
                await Promise.all(
                    jobsToRemove.map((job) => queue.remove(job.id)),
                )
                this.logger.debug(
                    `Removed ${jobsToRemove.length} jobs from ${queue.name} queue`,
                )
            }

            const redis = await queue.client
            const keys = await redis.keys(`bull:${queue.name}:*`)
            if (keys.length > 0) {
                await redis.del(keys)
                this.logger.debug(
                    `Cleared ${keys.length} Redis keys for ${queue.name} queue`,
                )
            }

            const remainingJobs = await queue.count()
            if (remainingJobs > 0) {
                this.logger.warn(
                    `Queue ${queue.name} not fully cleared: ${remainingJobs} jobs remain`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to clean ${queue.name} queue: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
