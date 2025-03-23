import { Mutation, Resolver } from '@nestjs/graphql'
import { Title } from './models/title.model'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleSyncService } from './services/sync/title-sync.service'

@Resolver(() => Title)
export class TitleResolver {
    constructor(
        private readonly titleSyncService: TitleSyncService,
        private readonly titleConfigSyncService: TitleConfigSyncService,
    ) {}

    @Mutation(() => Boolean, { name: 'syncTitleConfig' })
    async syncConfig(): Promise<boolean> {
        await this.titleConfigSyncService.syncConfigs()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncPopularTitles' })
    async syncPopular(): Promise<boolean> {
        return await this.titleSyncService.syncPopularTitles()
    }

    @Mutation(() => Boolean, { name: 'cleanUpTitleSyncData' })
    async cleanup(): Promise<boolean> {
        return await this.titleSyncService.cleanup()
    }
}
