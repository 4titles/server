import { FilmingLocationMapper } from '@/modules/locations/mappers/filming-location.mapper'
import { bigIntSerializer } from '../services/utils/json.utils'
import { DbTitle, Title } from '../types/title.type'
import { FilmingLocation } from '@/modules/locations/models/filming-location.model'

export class TitleMapper {
    private static mapFilmingLocations(
        filmingLocations?: FilmingLocation[],
    ): FilmingLocation[] {
        return filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(filmingLocations)
            : []
    }

    static mapSingleWithRelations<T extends Title>(
        title: DbTitle | null,
    ): T | null {
        if (!title) return null

        const serialized = JSON.parse(bigIntSerializer.stringify(title))

        return {
            ...serialized,
            filmingLocations: this.mapFilmingLocations(
                serialized.filmingLocations,
            ),
        } as T
    }

    static mapManyWithRelations<T extends Title>(titles: DbTitle[]): T[] {
        const serialized = JSON.parse(bigIntSerializer.stringify(titles))

        return serialized.map((title: T) => ({
            ...title,
            filmingLocations: this.mapFilmingLocations(title.filmingLocations),
        })) as T[]
    }
}
