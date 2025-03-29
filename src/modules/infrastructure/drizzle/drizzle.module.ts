import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import getDrizzleConfig from '@/config/drizzle.config'

export const DRIZZLE = Symbol('drizzle-connection')

@Global()
@Module({
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const { poolConfig, schema } = getDrizzleConfig(configService)

                const pool = new Pool(poolConfig)

                pool.on('connect', (client) => {
                    client.on('error', (err) =>
                        console.error('Postgres client error:', err),
                    )
                })

                return drizzle(pool, { schema }) as NodePgDatabase<
                    typeof schema
                >
            },
        },
    ],
    exports: [DRIZZLE],
})
export class DrizzleModule {}
