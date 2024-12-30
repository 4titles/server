import { Injectable } from '@nestjs/common'
import { DbMovie } from '@/drizzle/schema/movies.schema'
import { DbSeries } from '@/drizzle/schema/series.schema'
import { TitleType } from '@/titles/enums/title-type.enum'
import { MovieEntityService } from './movie-entity.service'
import { TvShowEntityService } from './tv-show-entity.service'
import { Movie } from '@/titles/models/movie.model'
import { TvShow } from '@/titles/models/tv-show.model'
import { TitleCategory } from '@/titles/enums/title-category.enum'

export interface TitleResult<M, S> {
    movie: M
    series: S
}

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
    ): Promise<TitleResult<DbMovie, DbSeries>> {
        const [movie, series] = await Promise.all([
            this.findMovieByImdbId(imdbId),
            this.findTvShowByImdbId(imdbId),
        ])

        return { movie, series }
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

    async createOrUpdate(
        entity: Movie | TvShow,
        type: TitleType,
    ): Promise<void> {
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
