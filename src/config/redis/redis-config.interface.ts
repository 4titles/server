import { RedisOptions } from 'ioredis'

export interface IRedisConfig extends RedisOptions {
    retryDelay: number
    dataTTL: number
}
