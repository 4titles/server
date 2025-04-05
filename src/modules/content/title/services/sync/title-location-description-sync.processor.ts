import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { LocationDescriptionJobData } from '../../types/sync-job.interface'
import { TitleLocationDescriptionSyncService } from './title-location-description-sync.service'

@Processor('title-location-description-sync', {
    concurrency: 2,
    limiter: { max: 1, duration: 1000 },
})
export class TitleLocationDescriptionSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(
        TitleLocationDescriptionSyncProcessor.name,
    )

    constructor(
        private readonly locationDescriptionSyncService: TitleLocationDescriptionSyncService,
    ) {
        super()
    }

    async process(job: Job<LocationDescriptionJobData>) {
        const { titleId, locationId, language } = job.data
        this.logger.debug(
            `Processing location description sync for titleId: ${titleId}, locationId: ${locationId}`,
        )

        try {
            await this.locationDescriptionSyncService.enhanceLocationDescription(
                titleId,
                locationId,
                language,
            )
            this.logger.debug(
                `Completed location description sync for locationId: ${locationId}`,
            )
        } catch (error) {
            this.logger.error(
                `Failed to process location description sync for locationId: ${locationId}`,
                error.stack,
            )
            throw error
        }
    }
}
