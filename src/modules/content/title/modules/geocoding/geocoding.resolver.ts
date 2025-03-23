import { Action } from '@/modules/auth/rbac/enums/actions.enum'
import { Resource } from '@/modules/auth/rbac/enums/resources.enum'
import { RbacProtected } from '@/shared/guards/rbac-protected.guard'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { GeocodingService } from './geocoding.service'
import { GeocodingResult } from './models/geocoding-result.model'

@Resolver()
export class GeocodingResolver {
    constructor(private readonly geocodingService: GeocodingService) {}

    @RbacProtected({
        resource: Resource.GEOCODING,
        action: Action.READ,
        possession: 'any',
    })
    @Query(() => [GeocodingResult], { name: 'geocodeAddress', nullable: true })
    async geocode(
        @Args('address') address: string,
    ): Promise<GeocodingResult[]> {
        return await this.geocodingService.geocodeAddress(address)
    }
}
