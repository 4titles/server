import { registerAs } from '@nestjs/config'

export interface IGeoapifyConfig {
    baseUrl: string
    categories: {
        [key: string]: string
    }
    filters: {
        [key: string]: string
    }
    bias: {
        [key: string]: string
    }
    conditions: string
    queryLimit: number
    cityGeometry: string
    coordinates: {
        latitude: number
        longitude: number
        radius: number
    }
}

export const SEVASTOPOL_COORDINATES = {
    latitude: 44.6054434,
    longitude: 33.5220842,
    radius: 5600,
}

export default registerAs(
    'geoapify',
    (): IGeoapifyConfig => ({
        baseUrl: 'https://api.geoapify.com/v2/places',
        categories: {
            ENTERTAINMENT: 'entertainment',
            CULTURE: 'entertainment.culture',
            PLANETARIUM: 'entertainment.planetarium',
            MUSEUM: 'entertainment.museum',
            CINEMA: 'entertainment.cinema',
            THEATRE: 'entertainment.culture.theatre',
        },
        filters: {
            CITY_GEOMETRY: `geometry:${process.env.CITY_GEOMETRY || '0cb6343e0af24ed189978d8d31066e4c'}`,
            CITY_CIRCLE: `circle:${SEVASTOPOL_COORDINATES.longitude},${SEVASTOPOL_COORDINATES.latitude},${SEVASTOPOL_COORDINATES.radius}`,
        },
        bias: {
            PROXIMITY: `proximity:${SEVASTOPOL_COORDINATES.longitude},${SEVASTOPOL_COORDINATES.latitude}`,
        },
        conditions: 'named',
        queryLimit: parseInt(process.env.GEOAPIFY_QUERY_LIMIT) || 5,
        cityGeometry:
            process.env.CITY_GEOMETRY || '0cb6343e0af24ed189978d8d31066e4c',
        coordinates: SEVASTOPOL_COORDINATES,
    }),
)
