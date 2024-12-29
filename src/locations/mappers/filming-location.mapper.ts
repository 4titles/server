import { FilmingLocation } from '../models/filming-location.model'

export class FilmingLocationMapper {
    static toGraphQL(dbLocation: any): FilmingLocation | null {
        if (!dbLocation?.location?.coordinates) {
            return null
        }

        const { x, y } = dbLocation.location.coordinates

        if (x === null || y === null) {
            return null
        }

        return {
            address: dbLocation.location.address || '',
            description: dbLocation.description || null,
            coordinates: {
                latitude: Number(y),
                longitude: Number(x),
            },
        }
    }

    static manyToGraphQL(dbLocations: any[]): FilmingLocation[] {
        if (!Array.isArray(dbLocations)) {
            console.warn('Expected array of locations, got:', dbLocations)
            return []
        }

        return dbLocations
            .map(this.toGraphQL)
            .filter(
                (location): location is FilmingLocation =>
                    location !== null &&
                    !isNaN(location.coordinates.latitude) &&
                    !isNaN(location.coordinates.longitude),
            )
    }
}
