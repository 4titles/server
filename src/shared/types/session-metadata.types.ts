export interface LocationInfo {
    country: {
        ru: string
        en: string
    }
    city: string
    latidute: number
    longitude: number
    region: string
    timezone: string
}

export interface DeviceInfo {
    browser: string
    os: string
    type: string
    brand: string
}

export interface SessionMetadata {
    location: LocationInfo
    device: DeviceInfo
    ip: string
}
