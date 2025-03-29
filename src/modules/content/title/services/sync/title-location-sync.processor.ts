import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { LocationSyncJobData } from '../../types/sync-job.interface'
import { TitleLocationSyncService } from './title-location-sync.service'

@Processor('title-location-sync', {
    concurrency: 4,
    limiter: { max: 2, duration: 1000 },
})
export class TitleLocationSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(TitleLocationSyncProcessor.name)

    constructor(
        private readonly titleLocationSyncService: TitleLocationSyncService,
    ) {
        super()
    }

    async process(job: Job<LocationSyncJobData>) {
        const { titleId, imdbId, category } = job.data
        this.logger.debug(
            `Processing location sync for titleId: ${titleId}, imdbId: ${imdbId}`,
        )

        try {
            await this.titleLocationSyncService.syncTitleLocations(
                titleId,
                imdbId,
                category,
            )
            this.logger.debug(`Completed location sync for titleId: ${titleId}`)
        } catch (error) {
            this.logger.error(
                `Failed to process location sync for titleId: ${titleId}`,
                error.stack,
            )
            throw error
        }
    }
}
