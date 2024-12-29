import { Resolver, Mutation, Args, Query } from '@nestjs/graphql'
import { Logger } from '@nestjs/common'
import { LocationsService } from '../services/locations.service'
import { FilmingLocation } from '../models/filming-location.model'
import { LocationsSyncResult } from '../models/locations-sync-result.model'

@Resolver(() => FilmingLocation)
export class LocationsResolver {
    private readonly logger = new Logger(LocationsResolver.name)

    constructor(private readonly locationsService: LocationsService) {}

    @Query(() => [FilmingLocation])
    async movieLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ) {
        return this.locationsService.getLocationsForTitle(imdbId, true)
    }

    @Query(() => [FilmingLocation])
    async tvShowLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ) {
        return this.locationsService.getLocationsForTitle(imdbId, false)
    }

    @Mutation(() => LocationsSyncResult)
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
