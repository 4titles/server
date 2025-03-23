import { TitleConfigSyncService } from '@/modules/content/title/services/sync/title-config-sync.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TitleConfigSeeder {
    constructor(
        private readonly titleConfigSyncService: TitleConfigSyncService,
    ) {}

    async seed() {
        try {
            await this.titleConfigSyncService.syncConfigs()
        } catch (error) {
            throw new Error(`Title config seeding failed: ${error.message}`)
        }
    }
}
