import { registerAs } from '@nestjs/config'
import { REDIS_SETTINGS } from './redis-config.constants'
import { IRedisConfig } from './redis-config.interface'

export default registerAs(
    'redis',
    (): IRedisConfig => ({
        host: REDIS_SETTINGS.HOST,
        port: REDIS_SETTINGS.PORT,
        username: REDIS_SETTINGS.USERNAME,
        password: REDIS_SETTINGS.PASSWORD,
        maxRetriesPerRequest: REDIS_SETTINGS.MAX_RETRIES_PER_REQUEST,
        retryDelay: REDIS_SETTINGS.CONNECTION_RETRY_DELAY,
        dataTTL: REDIS_SETTINGS.DATA_TTL,
    }),
)
