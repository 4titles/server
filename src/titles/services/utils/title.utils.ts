import { FilmingLocationMapper } from 'src/locations/mappers/filming-location.mapper'
import { Movie } from 'src/titles/models/movie.model'
import { TvShow } from 'src/titles/models/tv-show.model'
import { bigIntSerializer } from './json.utils'

export type Title = Movie | TvShow
type DbTitle = Omit<Title, 'filmingLocations'> & {
    filmingLocations?: any[]
}

export function mapTitleWithRelations<T extends Title>(
    title: DbTitle | null,
): T | null {
    if (!title) return null

    const serializedEntity = JSON.parse(bigIntSerializer.stringify(title))

    return {
        ...serializedEntity,
        filmingLocations: serializedEntity.filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(title.filmingLocations)
            : [],
    } as T
}

export function mapTitlesWithRelations<T extends Title>(
    titles: DbTitle[],
): T[] {
    const serializedEntities = JSON.parse(bigIntSerializer.stringify(titles))

    return serializedEntities.map((title) => ({
        ...title,
        filmingLocations: title.filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(title.filmingLocations)
            : [],
    })) as T[]
}
