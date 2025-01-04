export const DEFAULT_FETCH_LIMIT = 100
export const DEFAULT_SEARCH_LIMIT = 5

export const TITLE_RELATIONS = {
    filmingLocations: {
        with: {
            location: true,
        },
    },
    genres: {
        with: {
            genre: true,
        },
    },
} as const

export const TITLE_WITH_RELATIONS = {
    with: TITLE_RELATIONS,
} as const
