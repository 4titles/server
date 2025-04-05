import * as schema from '@/modules/infrastructure/drizzle/schema/schema'
import { ConfigService } from '@nestjs/config'
import { PoolConfig } from 'pg'

export interface DrizzleConfig {
    poolConfig: PoolConfig
    schema?: Record<string, unknown>
}

export default function getDrizzleConfig(
    configService: ConfigService,
): DrizzleConfig {
    return {
        poolConfig: {
            connectionString: configService.getOrThrow<string>('DATABASE_URL'),
            max: configService.get<number>('DB_POOL_MAX') ?? 10,
            idleTimeoutMillis:
                configService.get<number>('DB_IDLE_TIMEOUT_MS') ?? 30000,
            connectionTimeoutMillis:
                configService.get<number>('DB_CONNECT_TIMEOUT_MS') ?? 5000,
        },
        schema,
    }
}
