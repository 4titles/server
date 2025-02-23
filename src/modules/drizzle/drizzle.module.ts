import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/schema'

export const DRIZZLE = Symbol('drizzle-connection')

@Global()
@Module({
    providers: [
        {
            provide: DRIZZLE,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const databaseUrl = configService.get<string>('DATABASE_URL')
                console.log(`Database URL: ${databaseUrl}`)
                const pool = new Pool({
                    connectionString: databaseUrl,
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
