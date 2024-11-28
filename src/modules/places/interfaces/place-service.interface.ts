import { IPlace } from './place.interface'
import { PlaceFiltersDto } from '../dto/place-filters.dto'

export interface IPlaceService {
    getPlaces(filters?: PlaceFiltersDto): Promise<IPlace[]>
    getPlaceById(id: string): Promise<IPlace>
    searchPlaces(searchTerm: string): Promise<IPlace[]>
    updatePlaceCache(): Promise<void>
}
