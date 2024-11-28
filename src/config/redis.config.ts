import { registerAs } from '@nestjs/config'

export interface IRedisConfig {
    host: string
    port: number
    maxRetries: number
    retryDelay: number
    dataTTL: number
}

export default registerAs(
    'redis',
    (): IRedisConfig => ({
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetries: 5,
        retryDelay: 2000,
        dataTTL: Number(process.env.REDIS_TTL) || 8600,
    }),
)
