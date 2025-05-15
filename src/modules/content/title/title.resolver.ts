import { User } from '@/modules/auth/account/models/user.model'
import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { Authorized } from '@/shared/decorators/authorized.decorator'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CommentableType } from '../comment/enums/commentable-type.enum'
import { CommentFilterInput } from '../comment/inputs/comment-filter.input'
import { Comment } from '../comment/models/comment.model'
import { CommentService } from '../comment/services/comment.service'
import { TitleCategory } from './enums/title-category.enum'
import { TitleSyncSource } from './enums/title-sync-source.enum'
import { TitleType } from './enums/title-type.enum'
import { TitleFilterInput } from './inputs/title-filter.input'
import { TitleGeosearchInput } from './inputs/title-geosearch.input'
import { TitleSearchInput } from './inputs/title-search.input'
import { PaginatedTitleSearchResults } from './models/paginated-title-search-results.model'
import { TitleFilmingLocation } from './models/title-filming-location.model'
import { Title } from './models/title.model'
import { TitleElasticsearchService } from './modules/elasticsearch/title-elasticsearch.service'
import { TitleConfigSyncService } from './services/sync/title-config-sync.service'
import { TitleSyncService } from './services/sync/title-sync.service'
import { TitleQueryService } from './services/title-query.service'
import { TitleSearchService } from './services/title-search.service'
import { TitleService } from './services/title.service'

@Resolver(() => Title)
export class TitleResolver {
    constructor(
        private readonly titleSyncService: TitleSyncService,
        private readonly titleConfigSyncService: TitleConfigSyncService,
        private readonly titleQueryService: TitleQueryService,
        private readonly titleSearchService: TitleSearchService,
        private readonly titleElasticsearchService: TitleElasticsearchService,
        private readonly titleService: TitleService,
        private readonly commentService: CommentService,
    ) {}

    @Query(() => [Title])
    async findTitles(
        @Args('filter', { nullable: true }) filter?: TitleFilterInput,
    ): Promise<Title[]> {
        return await this.titleQueryService.getTitles(filter)
    }

    @Query(() => Title)
    async findTitleById(
        @Args('id', { type: () => String }) id: string,
    ): Promise<Title> {
        return await this.titleQueryService.getTitleById(id)
    }

    @Query(() => Title)
    async findTitleByTmdbId(@Args('tmdbId') tmdbId: string): Promise<Title> {
        return await this.titleQueryService.getTitleByTmdbId(tmdbId)
    }

    @Query(() => Title)
    async findTitleByImdbId(@Args('imdbId') imdbId: string): Promise<Title> {
        return await this.titleQueryService.getTitleByImdbId(imdbId)
    }

    @Query(() => Title)
    async findTitleBySlug(@Args('slug') slug: string): Promise<Title> {
        return await this.titleQueryService.getTitleBySlug(slug)
    }

    @Query(() => [Title])
    async findPopularTitles(
        @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
    ): Promise<Title[]> {
        return await this.titleQueryService.getPopularTitles(limit)
    }

    @Query(() => PaginatedTitleSearchResults)
    async searchTitles(
        @Args('input') input: TitleSearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitles(input)
    }

    @Query(() => PaginatedTitleSearchResults)
    async searchTitlesByLocationText(
        @Args('input') input: TitleSearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitlesByLocationText(input)
    }

    @Query(() => PaginatedTitleSearchResults)
    async searchTitlesByCoordinates(
        @Args('input') input: TitleGeosearchInput,
    ): Promise<PaginatedTitleSearchResults> {
        return await this.titleSearchService.searchTitlesByCoordinates(input)
    }

    @Query(() => [TitleFilmingLocation])
    async searchTitleFilmingLocations(
        @Args('titleId') titleId: string,
        @Args('query') query: string,
    ): Promise<TitleFilmingLocation[]> {
        return await this.titleSearchService.searchTitleFilmingLocations(
            titleId,
            query,
        )
    }

    @Query(() => [TitleFilmingLocation])
    async searchFilmingLocationsByIds(
        @Args('locationIds', { type: () => [String] }) locationIds: string[],
        @Args('query') query: string,
    ): Promise<TitleFilmingLocation[]> {
        return await this.titleSearchService.searchFilmingLocationsByIds(
            locationIds,
            query,
        )
    }

    @Query(() => [Comment])
    async findTitleComments(
        @Args('filter') filter: CommentFilterInput,
        @Authorized() user?: User,
    ): Promise<Comment[]> {
        return await this.commentService.findComments(
            {
                ...filter,
                commentableType: CommentableType.TITLE,
            },
            user?.id,
        )
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async syncTitleConfigs(): Promise<boolean> {
        await this.titleConfigSyncService.syncConfigs()
        return true
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async syncTitlesByCategory(
        @Args('category', { type: () => TitleCategory, nullable: true })
        category: TitleCategory | null,
    ): Promise<boolean> {
        await this.titleSyncService.syncByCategory(category)
        return true
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async syncTitleByTmdbId(
        @Args('tmdbId', { type: () => String }) tmdbId: string,
        @Args('type', { type: () => TitleType }) type: TitleType,
        @Args('category', { type: () => TitleCategory })
        category: TitleCategory,
    ): Promise<boolean> {
        await this.titleSyncService.syncTitle(
            tmdbId,
            type,
            category,
            TitleSyncSource.CATEGORY,
        )
        return true
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.DELETE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async cleanUpTitleSyncData(): Promise<boolean> {
        return await this.titleSyncService.cleanup()
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async rebuildElasticsearchIndex(): Promise<boolean> {
        return await this.titleElasticsearchService.recreateTitleIndex()
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.UPDATE,
        possession: 'any',
    })
    @Mutation(() => Boolean)
    async updateAllTitleSlugs(
        @Args('forceUpdate', { type: () => Boolean, defaultValue: false })
        forceUpdate: boolean = false,
    ): Promise<boolean> {
        const updatedCount =
            await this.titleService.updateSlugsForAllTitles(forceUpdate)
        return updatedCount > 0
    }

    @Mutation(() => Boolean)
    async trackTitleSearch(
        @Args('titleId', { nullable: true }) titleId?: string,
        @Args('slug', { nullable: true }) slug?: string,
    ): Promise<boolean> {
        const result = await this.titleQueryService.trackTitleSearch(
            titleId || null,
            slug || null,
        )
        return !!result
    }
}
