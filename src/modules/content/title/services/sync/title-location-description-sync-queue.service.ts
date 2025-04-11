import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job, JobsOptions, Queue } from 'bullmq'
import { LocationDescriptionJobData } from '../../types/sync-job.interface'

@Injectable()
export class TitleLocationDescriptionSyncQueueService {
    private readonly logger: Logger = new Logger(
        TitleLocationDescriptionSyncQueueService.name,
    )

    private DEFAULT_QUEUE_OPTIONS: JobsOptions = {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute in ms
        },
        priority: 3,
    }

    constructor(
        @InjectQueue('title-location-description-sync')
        private readonly descriptionSyncQueue: Queue,
    ) {}

    async addLocationDescriptionJob(
        titleId: string,
        locationId: string,
        language?: string,
        options?: JobsOptions,
    ): Promise<Job<LocationDescriptionJobData>> {
        this.logger.debug(
            `Adding location description job for titleId: ${titleId}, locationId: ${locationId}`,
        )

        const jobData: LocationDescriptionJobData = {
            titleId,
            locationId,
            language,
        }

        try {
            const job = await this.descriptionSyncQueue.add(
                `description:${locationId}`,
                jobData,
                {
                    ...this.DEFAULT_QUEUE_OPTIONS,
                    ...options,
                },
            )
            this.logger.debug(
                `Successfully added job with ID: ${job.id} for location: ${locationId}`,
            )
            return job
        } catch (error) {
            this.logger.error(
                `Failed to add location description job: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
