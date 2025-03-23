import { Injectable } from '@nestjs/common'
import { HashUtils } from '../../../../../shared/utils/common/hash.utils'
import { RawLocation } from '../../modules/filming-location/interfaces/raw-location.interface'
import { TmdbTitleExtendedResponse } from '../../modules/tmdb/types/tmdb.interface'

type CriticalField =
    | 'id'
    | 'title'
    | 'overview'
    | 'vote_average'
    | 'vote_count'
    | 'popularity'
    | 'status'
    | 'tagline'

type NonCriticalField =
    | 'images'
    | 'recommendations'
    | 'translations'
    | 'keywords'
    | 'credits'
    | 'similar'
    | 'alternative_titles'
    | 'external_ids'

@Injectable()
export class TitleChangeDetectorService {
    private readonly criticalFields: CriticalField[] = [
        'id',
        'title',
        'overview',
        'vote_average',
        'vote_count',
        'popularity',
        'status',
        'tagline',
    ]

    private readonly nonCriticalFields: NonCriticalField[] = [
        'images',
        'recommendations',
        'translations',
        'keywords',
        'credits',
        'similar',
        'alternative_titles',
        'external_ids',
    ]

    isTitleChanged(
        cachedDetails: TmdbTitleExtendedResponse | null,
        newDetails: TmdbTitleExtendedResponse,
    ): boolean {
        if (!cachedDetails) return true

        return (
            this.areCriticalFieldsChanged(cachedDetails, newDetails) ||
            this.areNonCriticalFieldsChanged(cachedDetails, newDetails)
        )
    }

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

    private areCriticalFieldsChanged(
        cached: TmdbTitleExtendedResponse,
        newData: TmdbTitleExtendedResponse,
    ): boolean {
        return this.criticalFields.some((field) => {
            const cachedValue = cached[field]
            const newValue = newData[field]
            return this.compareValues(cachedValue, newValue)
        })
    }

    private areNonCriticalFieldsChanged(
        cached: TmdbTitleExtendedResponse,
        newData: TmdbTitleExtendedResponse,
    ): boolean {
        return this.nonCriticalFields.some((field) => {
            const cachedValue = cached[field]
            const newValue = newData[field]

            if (!cachedValue && !newValue) return false
            if (!cachedValue || !newValue) return true

            return (
                HashUtils.hashData(cachedValue) !== HashUtils.hashData(newValue)
            )
        })
    }

    private compareValues(cached: any, newValue: any): boolean {
        if (typeof cached !== typeof newValue) return true

        if (typeof cached === 'object' && cached !== null) {
            if (Array.isArray(cached)) {
                return (
                    HashUtils.hashData(cached) !== HashUtils.hashData(newValue)
                )
            }
            return HashUtils.hashData(cached) !== HashUtils.hashData(newValue)
        }

        return cached !== newValue
    }
}
