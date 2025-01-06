import { Injectable, Logger } from '@nestjs/common'
import { Genre } from '../models/genre.model'
import { GenreEntityService } from './entity'
import { GenreMapper } from '../mappers/genre.mapper'

@Injectable()
export class GenreService {
    private readonly logger: Logger = new Logger(GenreService.name)

    constructor(private readonly genreEntityService: GenreEntityService) {}

    async getGenreByTmdbId(tmdbId: string): Promise<Genre> {
        return GenreMapper.toGraphQL(
            await this.genreEntityService.getByTmdbId(BigInt(tmdbId)),
        )
    }

    async getAllGenres(): Promise<Genre[]> {
        return GenreMapper.manyToGraphQL(await this.genreEntityService.getAll())
    }

    async getGenresForTitle(
        imdbId: string,
        isMovie?: boolean,
    ): Promise<Genre[]> {
        return GenreMapper.manyToGraphQL(
            await this.genreEntityService.getForTitle(imdbId, isMovie),
        )
    }

    async syncGenresForTitle(
        imdbId: string,
        genres: Genre[],
        isMovie?: boolean,
    ): Promise<boolean> {
        try {
            if (!genres.length) return true

            await this.genreEntityService.saveGenres(genres, imdbId, isMovie)

            return true
        } catch (error) {
            this.logger.error(
                `Failed to sync genres for title with imdbId: ${imdbId} - `,
                error,
            )
            return false
        }
    }
}
