import { Resolver, Query } from '@nestjs/graphql'
import { PlacesService } from './places.service'

@Resolver('Place')
export class PlacesResolver {
    constructor(private placesService: PlacesService) {}

    @Query('places')
    async places() {
        return this.placesService.getPlaces()
    }
}
