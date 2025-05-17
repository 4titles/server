import { Args, Query, Resolver } from '@nestjs/graphql'
import { FindFilmingLocationsInput } from './inputs/find-filming-locations.input'
import { FilmingLocation } from './models/filming-location.model'
import { FilmingLocationService } from './services/filming-location.service'

@Resolver(() => FilmingLocation)
export class FilmingLocationResolver {
    constructor(
        private readonly filmingLocationService: FilmingLocationService,
    ) {}

    @Query(() => [FilmingLocation])
    async findFilmingLocations(
        @Args('input') input: FindFilmingLocationsInput,
    ): Promise<FilmingLocation[]> {
        return await this.filmingLocationService.findFilmingLocations(input)
    }
}
