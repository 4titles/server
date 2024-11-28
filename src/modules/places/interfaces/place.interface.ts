export interface ICoordinates {
    latitude: number
    longitude: number
    radius?: number
}

export interface IPlace {
    id: string
    name: string
    country: string
    city: string
    coordinates: ICoordinates
    categories: string[]
    address: string
}
