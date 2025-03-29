import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { SyncJobData } from '../../types/sync-job.interface'
import { TitleSyncService } from './title-sync.service'

@Processor('title-sync', {
    concurrency: 8,
    limiter: { max: 4, duration: 1000 },
})
export class TitleSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(TitleSyncProcessor.name)

    constructor(private readonly titleSyncService: TitleSyncService) {
        super()
    }

    async process(job: Job<SyncJobData>): Promise<void> {
        this.logger.debug(
            `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
        )

        try {
            if ('category' in job.data && 'page' in job.data) {
                const { category, page = 1 } = job.data
                this.logger.debug(
                    `Processing category sync for: ${category}, page: ${page}`,
                )
                await this.titleSyncService.syncCategory(category, page)
                this.logger.debug(
                    `Finished category sync processing for: ${category}, page: ${page}`,
                )
            } else if ('tmdbId' in job.data && 'type' in job.data) {
                const { tmdbId, type, category, source } = job.data
                this.logger.debug(
                    `Processing title sync job for tmdbId: ${tmdbId}, type: ${type}, source: ${source}, category context: ${category}`,
                )
                await this.titleSyncService.syncTitle(
                    tmdbId,
                    type,
                    category,
                    source,
                )
                this.logger.debug(
                    `Finished title sync job for tmdbId: ${tmdbId}`,
                )
            } else {
                this.logger.warn(
                    `Unknown or incomplete job data format received: ${JSON.stringify(job.data)}. Skipping job ${job.id}`,
                )
            }
        } catch (error) {
            this.logger.error(
                `Failed to process job ${job.id} with data ${JSON.stringify(job.data)}: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }
}
