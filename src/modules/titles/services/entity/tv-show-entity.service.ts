import { DbSeries } from '@/modules/drizzle/schema/schema'
import { Injectable } from '@nestjs/common'
import { series } from '@/modules/drizzle/schema/series.schema'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { BaseTitleEntityService } from './base-title-entity.service'

@Injectable()
export class TvShowEntityService extends BaseTitleEntityService<DbSeries> {
    constructor(db: DrizzleDB) {
        super(db, series, 'series')
    }
}
