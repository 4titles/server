import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql'
import { TitleSyncResult } from './models/title-sync-result.model'
import { Title } from './models/title.model'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleSyncService } from './services/sync/title-sync.service'
import { TitleQueryService } from './services/title-query.service'

@Resolver(() => Title)
export class TitleResolver {
    constructor(
        private readonly titleSyncService: TitleSyncService,
        private readonly titleConfigSyncService: TitleConfigSyncService,
        private readonly titleQueryService: TitleQueryService,
    ) {}

    @Query(() => Title, { name: 'title' })
    async getTitleById(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<Title> {
        return await this.titleQueryService.getTitleById(id)
    }

    @Query(() => Title, { name: 'titleByTmdbId' })
    async getTitleByTmdbId(@Args('tmdbId') tmdbId: string): Promise<Title> {
        return await this.titleQueryService.getTitleByTmdbId(tmdbId)
    }

    @Query(() => Title, { name: 'titleByImdbId' })
    async getTitleByImdbId(@Args('imdbId') imdbId: string): Promise<Title> {
        return await this.titleQueryService.getTitleByImdbId(imdbId)
    }

    @Mutation(() => Boolean, { name: 'syncTitleConfig' })
    async syncConfig(): Promise<boolean> {
        await this.titleConfigSyncService.syncConfigs()
        return true
    }

    @Mutation(() => TitleSyncResult, { name: 'syncPopularTitles' })
    async syncPopular(): Promise<TitleSyncResult> {
        return await this.titleSyncService.syncPopularTitles()
    }

    @Mutation(() => Boolean, { name: 'cleanUpTitleSyncData' })
    async cleanup(): Promise<boolean> {
        return await this.titleSyncService.cleanup()
    }
}
