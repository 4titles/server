import { Injectable } from '@nestjs/common'
import { HashUtils } from '../../../../../shared/utils/common/hash.utils'
import { RawLocation } from '../../modules/filming-location/interfaces/raw-location.interface'

@Injectable()
export class TitleChangeDetectorService {
    areLocationsChanged(
        cachedLocations: RawLocation[] | null,
        newLocations: RawLocation[],
    ): boolean {
        if (
            !cachedLocations ||
            cachedLocations.length !== newLocations.length
        ) {
            return true
        }

        const sortedCachedLocations = [...cachedLocations].sort((a, b) =>
            a.address.localeCompare(b.address),
        )
        const sortedNewLocations = [...newLocations].sort((a, b) =>
            a.address.localeCompare(b.address),
        )

        return (
            HashUtils.hashData(sortedCachedLocations) !==
            HashUtils.hashData(sortedNewLocations)
        )
    }
}
