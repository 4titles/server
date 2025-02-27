import { DRIZZLE } from '@/modules/drizzle/drizzle.module'
import { DrizzleDB } from '@/modules/drizzle/types/drizzle'
import { Inject, Injectable } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'
import { sql } from 'drizzle-orm'

@Injectable()
export class PostgresHealthService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

    async check(key: string): Promise<HealthIndicatorResult> {
        try {
            const startTime = Date.now()
            await this.db.execute(sql`SELECT 1`)
            const responseTime = Date.now() - startTime

            return {
                [key]: {
                    status: 'up',
                    responseTime: `${responseTime}ms`,
                },
            }
        } catch (error) {
            return { [key]: { status: 'down', message: error.message } }
        }
    }
}
