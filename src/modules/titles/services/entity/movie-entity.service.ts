import { DbMovie } from '@/modules/drizzle/schema/schema'
import { Injectable } from '@nestjs/common'
import { movies } from '@/modules/drizzle/schema/movies.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import {
    BaseTitleEntityService,
    QueryOptions,
} from './base-title-entity.service'
import { DEFAULT_FETCH_LIMIT } from '../constants/query.constants'
import { TitleCategory } from '../../enums/title-category.enum'

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
