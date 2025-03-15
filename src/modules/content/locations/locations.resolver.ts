import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { FilmingLocation } from './models/filming-location.model'
import { LocationsSyncResult } from './models/locations-sync-result.model'
import { LocationsService } from './services/locations.service'

@Resolver(() => FilmingLocation)
export class LocationsResolver {
    constructor(private readonly locationsService: LocationsService) {}

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [FilmingLocation], {
        description: 'Get filming locations for a movie by its IMDB ID',
    })
    async movieLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ): Promise<FilmingLocation[]> {
        return this.locationsService.getLocationsForTitle(imdbId, true)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [FilmingLocation], {
        description: 'Get filming locations for a TV show by its IMDB ID',
    })
    async tvShowLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ): Promise<FilmingLocation[]> {
        return this.locationsService.getLocationsForTitle(imdbId, false)
    }

    @RbacProtected({
        resource: Resource.TITLE,
        action: Action.CREATE,
        possession: 'any',
    })
    @Mutation(() => LocationsSyncResult, {
        description:
            'Synchronize filming locations for specified IMDB IDs or all locations if none provided',
    })
    async syncLocations(
        @Args('imdbIds', { type: () => [String], nullable: true })
        imdbIds?: string[],
    ): Promise<LocationsSyncResult> {
        if (imdbIds?.length) {
            return this.locationsService.syncLocationsForTitles(imdbIds)
        }
        return this.locationsService.syncAllLocations()
    }
}
