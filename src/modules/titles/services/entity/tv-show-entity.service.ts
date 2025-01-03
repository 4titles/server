import { DbSeries } from '@/modules/drizzle/schema/schema'
import { Injectable } from '@nestjs/common'
import { series } from '@/modules/drizzle/schema/series.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import {
    BaseTitleEntityService,
    QueryOptions,
} from './base-title-entity.service'
import { DEFAULT_FETCH_LIMIT } from '../constants/query.constants'
import { TitleCategory } from '../../enums/title-category.enum'

@Injectable()
export class TvShowEntityService extends BaseTitleEntityService<DbSeries> {
    constructor(db: DrizzleDB) {
        super(db, series, 'series')
    }

    async getAiring(
        limit: number = DEFAULT_FETCH_LIMIT,
        options?: QueryOptions,
    ) {
        return this.getByCategory(TitleCategory.AIRING, limit, options)
    }
}
