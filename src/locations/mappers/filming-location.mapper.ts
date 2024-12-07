import { FilmingLocation } from '../models/filming-location.model'

export class FilmingLocationMapper {
    static toGraphQL(dbLocation: any): FilmingLocation {
        return {
            address: dbLocation.location.address,
            description: dbLocation.description || null,
            latitude: dbLocation.location.latitude || null,
            longitude: dbLocation.location.longitude || null,
        }
    }

    static manyToGraphQL(dbLocations: any[]): FilmingLocation[] {
        return dbLocations.map(this.toGraphQL)
    }
}
