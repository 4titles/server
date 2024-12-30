import { Resolver, Mutation, Args, Query } from '@nestjs/graphql'
import { LocationsService } from '../services/locations.service'
import { FilmingLocation } from '../models/filming-location.model'
import { LocationsSyncResult } from '../models/locations-sync-result.model'

@Resolver(() => FilmingLocation)
export class LocationsResolver {
    constructor(private readonly locationsService: LocationsService) {}

    @Query(() => [FilmingLocation], {
        description: 'Get filming locations for a movie by its IMDB ID',
    })
    async movieLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ): Promise<FilmingLocation[]> {
        return this.locationsService.getLocationsForTitle(imdbId, true)
    }

    @Query(() => [FilmingLocation], {
        description: 'Get filming locations for a TV show by its IMDB ID',
    })
    async tvShowLocations(
        @Args('imdbId', { type: () => String }) imdbId: string,
    ): Promise<FilmingLocation[]> {
        return this.locationsService.getLocationsForTitle(imdbId, false)
    }

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
