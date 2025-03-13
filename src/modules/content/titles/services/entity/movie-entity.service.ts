import { movies } from '@/modules/infrastructure/drizzle/schema/movies.schema'
import { DbMovie } from '@/modules/infrastructure/drizzle/schema/schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Injectable } from '@nestjs/common'
import { TitleCategory } from '../../enums/title-category.enum'
import { DEFAULT_FETCH_LIMIT } from '../constants/query.constants'
import {
    BaseTitleEntityService,
    QueryOptions,
} from './base-title-entity.service'

@Injectable()
export class MovieEntityService extends BaseTitleEntityService<DbMovie> {
    constructor(db: DrizzleDB) {
        super(db, movies, 'movies')
    }

    async getUpcoming(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ): Promise<DbMovie[]> {
        return this.getByCategory(TitleCategory.UPCOMING, limit, options)
    }
}
