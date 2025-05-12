import { TitleSortOption } from '../../enums/title-sort-option.enum'
import { TitleFilterInput } from '../../inputs/title-filter.input'

export interface TitleAdvancedFilters {
    releaseDateFrom?: Date
    releaseDateTo?: Date
    genreIds?: string[]
    countryIsos?: string[]
    name?: string
    runtimeFrom?: number
    runtimeTo?: number
    originalLanguageIsos?: string[]
    voteAverageFrom?: number
    voteAverageTo?: number
    statuses?: string[]
    sortBy?: TitleSortOption
}

export function convertFilterToAdvanced(
    filter: TitleFilterInput,
): TitleAdvancedFilters {
    const advancedFilters: TitleAdvancedFilters = {}

    if (filter.releaseDateRange) {
        if (filter.releaseDateRange.from) {
            advancedFilters.releaseDateFrom = new Date(
                filter.releaseDateRange.from,
            )
        }
        if (filter.releaseDateRange.to) {
            advancedFilters.releaseDateTo = new Date(filter.releaseDateRange.to)
        }
    }

    if (filter.genreIds && filter.genreIds.length > 0) {
        advancedFilters.genreIds = filter.genreIds
    }

    if (filter.countryIsos && filter.countryIsos.length > 0) {
        advancedFilters.countryIsos = filter.countryIsos
    }

    if (filter.name) {
        advancedFilters.name = filter.name
    }

    if (filter.runtimeRange) {
        if (filter.runtimeRange.from !== undefined) {
            advancedFilters.runtimeFrom = filter.runtimeRange.from
        }
        if (filter.runtimeRange.to !== undefined) {
            advancedFilters.runtimeTo = filter.runtimeRange.to
        }
    }

    if (filter.originalLanguageIsos && filter.originalLanguageIsos.length > 0) {
        advancedFilters.originalLanguageIsos = filter.originalLanguageIsos
    }

    if (filter.voteAverageRange) {
        if (filter.voteAverageRange.from !== undefined) {
            advancedFilters.voteAverageFrom = filter.voteAverageRange.from
        }
        if (filter.voteAverageRange.to !== undefined) {
            advancedFilters.voteAverageTo = filter.voteAverageRange.to
        }
    }

    if (filter.statuses && filter.statuses.length > 0) {
        advancedFilters.statuses = filter.statuses
    }

    if (filter.sortBy) {
        advancedFilters.sortBy = filter.sortBy
    }

    return advancedFilters
}
