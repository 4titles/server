import { DbGenre } from '@/modules/drizzle/schema/genres.schema'
import { Genre } from '../models/genre.model'
export class GenreMapper {
    static toGraphQL(dbGenre: DbGenre): Genre {
        return {
            id: dbGenre.id,
            tmdbId: dbGenre.tmdbId.toString(),
            names: dbGenre.names,
        }
    }

    static manyToGraphQL(dbGenres: DbGenre[]): Genre[] {
        return dbGenres.map(this.toGraphQL)
    }
}
