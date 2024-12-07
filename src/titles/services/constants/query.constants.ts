export const TITLE_RELATIONS = {
    filmingLocations: {
        with: {
            location: true,
        },
    },
} as const

export const TITLE_WITH_RELATIONS = {
    with: TITLE_RELATIONS,
} as const
