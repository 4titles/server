import { DbSeries } from '@/modules/infrastructure/drizzle/schema/schema'
import { series } from '@/modules/infrastructure/drizzle/schema/series.schema'
import { DrizzleDB } from '@/modules/infrastructure/drizzle/types/drizzle'
import { Injectable } from '@nestjs/common'
import { TitleCategory } from '../../enums/title-category.enum'
import { DEFAULT_FETCH_LIMIT } from '../constants/query.constants'
import {
    BaseTitleEntityService,
    QueryOptions,
} from './base-title-entity.service'

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
