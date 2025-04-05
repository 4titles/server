import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { TitleFilterInput } from './inputs/title-filter.input'
import { TitleGeosearchInput } from './inputs/title-geosearch.input'
import { TitleSearchInput } from './inputs/title-search.input'
import { PaginatedTitleSearchResults } from './models/paginated-title-search-results.model'
import { Title } from './models/title.model'
import { TitleElasticsearchService } from './modules/elasticsearch/title-elasticsearch.service'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleSyncService } from './services/sync/title-sync.service'
import { TitleQueryService } from './services/title-query.service'
import { TitleSearchService } from './services/title-search.service'

// TODO: protect w/ RBAC
@Resolver(() => Title)
export class TitleResolver {
    constructor(
        private readonly titleSyncService: TitleSyncService,
        private readonly titleConfigSyncService: TitleConfigSyncService,
        private readonly titleQueryService: TitleQueryService,
        private readonly titleSearchService: TitleSearchService,
        private readonly titleElasticsearchService: TitleElasticsearchService,
    ) {}

    @Query(() => PaginatedTitleSearchResults, { name: 'titles' })
    async getTitles(
        @Args('filter', { nullable: true }) filter?: TitleFilterInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleQueryService.getTitles(filter)
    }

    @Query(() => Title, { name: 'title' })
    async getTitleById(
        @Args('id', { type: () => String }) id: string,
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

    @Query(() => PaginatedTitleSearchResults, { name: 'searchTitles' })
    async searchTitles(
        @Args('input') input: TitleSearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitles(input)
    }

    @Query(() => PaginatedTitleSearchResults, {
        name: 'searchTitlesByLocationText',
    })
    async searchTitlesByLocationText(
        @Args('input') input: TitleSearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitlesByLocationText(input)
    }

    @Query(() => PaginatedTitleSearchResults, {
        name: 'searchTitlesByCoordinates',
    })
    async searchTitlesByCoordinates(
        @Args('input') input: TitleGeosearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitlesByCoordinates(input)
    }

    @Mutation(() => Boolean, { name: 'syncTitleConfig' })
    async syncConfig(): Promise<boolean> {
        await this.titleConfigSyncService.syncConfigs()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncPopularTitles' })
    async syncPopular(): Promise<boolean> {
        await this.titleSyncService.syncPopularTitles()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncTopRatedTitles' })
    async syncTopRated(): Promise<boolean> {
        await this.titleSyncService.syncTopRatedTitles()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncTrendingTitles' })
    async syncTrending(): Promise<boolean> {
        await this.titleSyncService.syncTrendingTitles()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncUpcomingTitles' })
    async syncUpcoming(): Promise<boolean> {
        await this.titleSyncService.syncUpcomingTitles()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncAiringTitles' })
    async syncAiring(): Promise<boolean> {
        await this.titleSyncService.syncAiringTitles()
        return true
    }

    @Mutation(() => Boolean, { name: 'syncAllTitles' })
    async syncAll(): Promise<boolean> {
        await this.titleSyncService.syncAll()
        return true
    }

    @Mutation(() => Boolean, { name: 'cleanUpTitleSyncData' })
    async cleanup(): Promise<boolean> {
        return await this.titleSyncService.cleanup()
    }

    @Mutation(() => Boolean, { name: 'rebuildTitleElasticsearchIndex' })
    async rebuildElasticsearchIndex(): Promise<boolean> {
        return await this.titleElasticsearchService.recreateTitleIndex()
    }
}
