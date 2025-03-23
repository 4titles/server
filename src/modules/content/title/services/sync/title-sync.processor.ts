import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { TitleCategory } from '../../enums/title-category.enum'
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

    async process(job: Job<{ category: TitleCategory; page?: number }>) {
        const { category, page = 1 } = job.data
        this.logger.debug(
            `Processing sync for category: ${category}, page: ${page}`,
        )

        try {
            const processedCount =
                await this.titleSyncService.syncTitlesByCategory(category, page)
            this.logger.debug(
                `Completed sync for category: ${category}, page: ${page}, processed: ${processedCount}`,
            )
            return { processedCount }
        } catch (error) {
            this.logger.error(
                `Failed to process sync for category: ${category}, page: ${page}`,
                error.stack,
            )
            throw error
        }
    }
}
