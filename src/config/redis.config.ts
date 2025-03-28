import { ConfigService } from '@nestjs/config'
import { RedisOptions } from 'ioredis'

export default function getRedisConfig(
    configService: ConfigService,
): RedisOptions {
    return {
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: configService.getOrThrow<number>('REDIS_PORT'),
        username: configService.getOrThrow<string>('REDIS_USERNAME'),
        password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        maxRetriesPerRequest:
            configService.get<number>('MAX_RETRIES_PER_REQUEST') || 5,
        retryStrategy: (times: number) =>
            Math.min(
                times *
                    (configService.get<number>('REDIS_RETRY_DELAY_MS') ?? 2000),
                configService.get<number>('REDIS_MAX_RETRY_DELAY_MS') ?? 10000,
            ),
        connectTimeout:
            configService.get<number>('REDIS_CONNECT_TIMEOUT_MS') ?? 5000,
        commandTimeout:
            configService.get<number>('REDIS_COMMAND_TIMEOUT_MS') ?? 3000,
        socketTimeout:
            configService.get<number>('REDIS_SOCKET_TIMEOUT_MS') ?? 5000,
        enableAutoPipelining:
            configService.get('REDIS_AUTO_PIPELINING') ?? true,
        enableOfflineQueue: configService.get('REDIS_OFFLINE_QUEUE') ?? true,
        enableReadyCheck: configService.get('REDIS_READY_CHECK') ?? true,
    }
}
