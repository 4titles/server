import { Injectable, Logger } from '@nestjs/common'
import { Genre } from '../models/genre.model'
import { GenreEntityService, TitleEntityService } from './entity'
import { GenreMapper } from '../mappers/genre.mapper'

@Injectable()
export class GenreService {
    private readonly logger: Logger = new Logger(GenreService.name)

    constructor(
        private readonly genreEntityService: GenreEntityService,
        private readonly titleEntityService: TitleEntityService,
    ) {}

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
        if (typeof isMovie !== 'boolean') {
            const { movie, series } =
                await this.titleEntityService.findByImdbId(imdbId)

            if (!movie && !series) {
                return []
            }

            isMovie = !!movie
        }

        return GenreMapper.manyToGraphQL(
            await this.genreEntityService.getForTitle(imdbId, isMovie),
        )
    }

    async syncGenresForTitle(
        imdbId: string,
        genres: Genre[],
    ): Promise<boolean> {
        try {
            if (!genres.length) return true

            const { movie, series } =
                await this.titleEntityService.findByImdbId(imdbId)

            await this.genreEntityService.saveGenres(
                genres,
                movie?.id,
                series?.id,
            )

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
