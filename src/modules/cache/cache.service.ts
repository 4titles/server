import { Global, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { IRedisConfig } from 'src/config/redis.config'

@Global()
@Injectable()
export class CacheService implements OnModuleInit {
    private redis: Redis
    private readonly logger = new Logger(CacheService.name)

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        const config = this.configService.get('redis')
        if (!config) {
            throw new Error('Redis configuration is not loaded')
        }

        this.redis = await this.initializeRedis(config)
    }

    private async initializeRedis(config: IRedisConfig): Promise<Redis> {
        const redis = new Redis({
            host: config.host,
            port: config.port,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, config.retryDelay)
                this.logger.log(`Retrying Redis connection in ${delay}ms...`)
                return delay
            },
            maxRetriesPerRequest: config.maxRetries,
        })

        redis.on('error', (err) => {
            this.logger.error('Redis connection error:', err)
        })

        redis.on('connect', () => {
            this.logger.log('Successfully connected to Redis')
        })

        return redis
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key)
        return data ? JSON.parse(data) : null
    }

    async set(
        key: string,
        value: any,
        expirationSeconds: number = 8600,
    ): Promise<void> {
        await this.redis.set(
            key,
            JSON.stringify(value),
            'EX',
            expirationSeconds,
        )
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key)
            this.logger.log(`Cache with key '${key}' has been deleted.`)
        } catch (err) {
            this.logger.error(`Failed to delete cache with key '${key}':`, err)
        }
    }

    async clear(): Promise<void> {
        await this.redis.flushall()
        this.logger.log('Cache has been cleared.')
    }
}
