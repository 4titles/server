export interface GeocodingApiResponse {
    results: GeocodingResultPropery[]
    query: {
        text: string
        parsed: {
            city: string
            expected_type: string
        }
    }
}

export interface GeocodingResultPropery {
    country_code?: string
    street?: string
    country?: string
    datasource?: {
        sourcename?: string
        attribution?: string
        license?: string
        url?: string
    }
    state?: string
    city?: string
    lon: number
    lat: number
    result_type?: string
    formatted: string
    address_line1?: string
    address_line2?: string
    timezone?: {
        name?: string
        offset_STD?: string
        offset_STD_seconds?: number
        offset_DST?: string
        offset_DST_seconds?: number
        abbreviation_STD?: string
        abbreviation_DST?: string
    }
    plus_code?: string
    plus_code_short?: string
    rank?: {
        popularity?: number
        confidence?: number
        confidence_street_level?: number
        match_type?: string
    }
    place_id?: string
    bbox?: {
        lon1?: number
        lat1?: number
        lon2?: number
        lat2?: number
    }
}
