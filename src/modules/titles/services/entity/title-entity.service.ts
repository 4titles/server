import { Injectable, NotFoundException } from '@nestjs/common'
import { DbMovie } from '@/modules/drizzle/schema/movies.schema'
import { DbSeries } from '@/modules/drizzle/schema/series.schema'
import { MovieEntityService } from './movie-entity.service'
import { TvShowEntityService } from './tv-show-entity.service'
import { TitleCategory } from '../../enums/title-category.enum'
import { TitleType } from '../../enums/title-type.enum'
import { DbTitle, Title, TitleEntityFetchResult } from '../../types/title.type'

@Injectable()
export class TitleEntityService {
    constructor(
        private readonly movieEntityService: MovieEntityService,
        private readonly tvShowEntityService: TvShowEntityService,
    ) {}

    async findMovieByImdbId(imdbId: string): Promise<DbMovie | undefined> {
        return await this.movieEntityService.getByImdbId(imdbId)
    }

    async findTvShowByImdbId(imdbId: string): Promise<DbSeries | undefined> {
        return await this.tvShowEntityService.getByImdbId(imdbId)
    }

    async findByImdbId(
        imdbId: string,
        isMovie?: boolean,
    ): Promise<TitleEntityFetchResult> {
        if (typeof isMovie === 'boolean') {
            const title = isMovie
                ? await this.findMovieByImdbId(imdbId)
                : await this.findTvShowByImdbId(imdbId)

            if (!title) {
                throw new NotFoundException(
                    `${isMovie ? 'Movie' : 'TV Show'} with IMDB ID ${imdbId} not found`,
                )
            }

            return {
                type: isMovie ? TitleType.MOVIES : TitleType.TV_SHOWS,
                title,
            }
        }

        const [movie, series] = await Promise.all([
            this.movieEntityService.getByImdbId(imdbId),
            this.tvShowEntityService.getByImdbId(imdbId),
        ])

        if (movie) {
            return { type: TitleType.MOVIES, title: movie }
        }

        if (series) {
            return { type: TitleType.TV_SHOWS, title: series }
        }

        throw new NotFoundException(`Title with IMDB ID ${imdbId} not found`)
    }

    async findByType(imdbId: string, type: TitleType): Promise<DbTitle> {
        const entity =
            type === TitleType.MOVIES
                ? await this.movieEntityService.getByImdbId(imdbId)
                : await this.tvShowEntityService.getByImdbId(imdbId)

        if (!entity) {
            throw new NotFoundException(
                `${type === TitleType.MOVIES ? 'Movie' : 'TV Show'} with IMDB ID ${imdbId} not found`,
            )
        }

        return entity
    }

    async findAll(
        category?: TitleCategory,
        limit?: number,
    ): Promise<[DbMovie[], DbSeries[]]> {
        const [movies, series] = await Promise.all([
            this.movieEntityService.getByCategory(category, limit),
            this.tvShowEntityService.getByCategory(category, limit),
        ])

        return [movies, series]
    }

    async createOrUpdate(entity: Title, type: TitleType): Promise<void> {
        if (!type) {
            throw new Error(
                'Title type must be specified for create/update operation',
            )
        }

        if (type === TitleType.MOVIES) {
            await this.movieEntityService.createOrUpdate(entity as DbMovie)
        } else {
            await this.tvShowEntityService.createOrUpdate(entity as DbSeries)
        }
    }
}
