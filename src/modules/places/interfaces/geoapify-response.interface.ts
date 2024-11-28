export interface IGeoapifyFeature {
    type: string
    properties: {
        place_id: string
        name: string
        country: string | null
        city: string | null
        formatted: string
        categories: string[]
        datasource: {
            sourcename: string
            attribution: string
            license: string
        }
        [key: string]: any
    }
    geometry: {
        type: string
        coordinates: [number, number]
    }
}

export interface IGeoapifyResponse {
    type: string
    features: IGeoapifyFeature[]
    query: {
        text: string
        parsed: {
            city: string
            expected_type: string
        }
    }
}
