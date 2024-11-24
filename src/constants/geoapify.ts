export const GEOAPIFY_API_BASE_URL = 'https://api.geoapify.com/v2/places'

export const COORDINATES = {
    LAT: 44.6054434,
    LON: 33.5220842,
    RADIUS: 5600,
    CITY_GEOMETRY: '0cb6343e0af24ed189978d8d31066e4c',
}

export const GEOAPIFY_CULTURAL_CATEGORIES = {
    ENTERTAINMENT: 'entertainment',
    ENTERTAINMENT_CULTURE: 'entertainment.culture',
    ENTERTAINMENT_PLANETARIUM: 'entertainment.planetarium',
    ETNERTAINMENT_MUSEUM: 'entertainment.museum',
    ENTERTAINMENT_CINEMA: 'entertainment.cinema',
} as const

export const GEOAPIFY_FILTERS = {
    SEVASTOPOL_ISOLINE: `geometry:${COORDINATES.CITY_GEOMETRY}`,
    SEVASTOPOL_CIRCLE: `circle:${COORDINATES.LON},${COORDINATES.LAT},${COORDINATES.RADIUS}`,
}

export const GEOAPIFY_BIAS = {
    SEVASTOPOL_PROXIMITY: `proximity:${COORDINATES.LON},${COORDINATES.LAT}`,
}

export const GEOAPIFY_CONDITIONS = 'named'

export const GEOAPIFY_QUERY_LIMIT = 1
