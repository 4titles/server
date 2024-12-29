import { FilmingLocationMapper } from 'src/locations/mappers/filming-location.mapper'
import { Movie } from 'src/titles/models/movie.model'
import { TvShow } from 'src/titles/models/tv-show.model'

type Title = Movie | TvShow
type DbTitle = Omit<Title, 'filmingLocations'> & {
    filmingLocations?: any[]
}

export function mapTitleWithRelations<T extends Title>(
    title: DbTitle | null,
): T | null {
    if (!title) return null

    return {
        ...title,
        filmingLocations: title.filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(title.filmingLocations)
            : [],
    } as T
}

export function mapTitlesWithRelations<T extends Title>(
    titles: DbTitle[],
): T[] {
    return titles.map((title) => ({
        ...title,
        filmingLocations: title.filmingLocations
            ? FilmingLocationMapper.manyToGraphQL(title.filmingLocations)
            : [],
    })) as T[]
}
