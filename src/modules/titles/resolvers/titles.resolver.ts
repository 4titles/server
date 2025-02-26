import { Resolver, Mutation, Args, Int } from '@nestjs/graphql'
import { TitlesService } from '../services/titles.service'
import { Logger } from '@nestjs/common'
import { SyncResult } from '../models/sync-result.model'
import { TitleType } from '../enums/title-type.enum'
import { FullSyncResult } from '../models/full-sync-result.model'

@Resolver()
export class TitlesResolver {
    private readonly logger = new Logger(TitlesResolver.name)

    constructor(private readonly titlesService: TitlesService) {}

    @Mutation(() => SyncResult, {
        description: 'Synchronize popular titles with an optional type filter',
    })
    async syncPopularTitles(
        @Args('type', { type: () => TitleType, nullable: true })
        type: TitleType = TitleType.ALL,
    ) {
        this.logger.log(
            `Starting popular titles cache refresh for type: ${type}`,
        )
        const result = await this.titlesService.syncPopularTitles(type)
        this.logger.log('Cache refresh completed')
        return result
    }

    @Mutation(() => SyncResult, {
        description: 'Synchronize trending titles with an optional type filter',
    })
    async syncTrendingTitles(
        @Args('type', { type: () => TitleType, nullable: true })
        type: TitleType = TitleType.ALL,
    ) {
        this.logger.log(
            `Starting trending titles cache refresh for type: ${type}`,
        )
        const result = await this.titlesService.syncTrendingTitles(type)
        this.logger.log('Cache refresh completed')
        return result
    }

    @Mutation(() => SyncResult, {
        description:
            'Synchronize top-rated titles with an optional type filter and limit',
    })
    async syncTopRatedTitles(
        @Args('type', { type: () => TitleType, nullable: true })
        @Args('limit', { type: () => Int, nullable: true })
        type: TitleType = TitleType.ALL,
        limit: number = 100,
    ) {
        this.logger.log(`Starting titles cache refresh for type: ${type}`)
        const result = await this.titlesService.syncTopRatedTitles(type, limit)
        this.logger.log('Cache refresh completed')
        return result
    }

    @Mutation(() => SyncResult, {
        description: 'Synchronize upcoming titles with an optional limit',
    })
    async syncUpcomingTitles(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        this.logger.log(`Starting titles cache refresh for upcoming`)
        const result = await this.titlesService.syncUpcomingTitles(limit)
        this.logger.log('Cache refresh completed')
        return result
    }

    @Mutation(() => SyncResult, {
        description: 'Synchronize airing titles with an optional limit',
    })
    async syncAiringTitles(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        this.logger.log(`Starting titles cache refresh for airing`)
        const result = await this.titlesService.syncAiringTitles(limit)
        this.logger.log('Cache refresh completed')
        return result
    }

    @Mutation(() => FullSyncResult, {
        description: 'Perform a full content cache refresh',
    })
    async syncAllContent() {
        this.logger.log('Starting full content cache refresh')
        const result = await this.titlesService.syncAllContent()
        this.logger.log('Cache refresh completed')
        return result
    }
}
