import getRedisConfig from '@/config/redis.config'
import { bigIntSerializer } from '@/shared/utils/common/json.utils'
import { Global, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis, RedisOptions } from 'ioredis'

@Global()
@Injectable()
export class CacheService implements OnModuleInit {
    private redis: Redis
    private readonly logger = new Logger(CacheService.name)
    private readonly DEFAULT_EXPIRATION = 8600 // ~2.4 hours

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        const config = getRedisConfig(this.configService)
        if (!config) {
            throw new Error('Redis configuration is not loaded')
        }

        this.redis = await this.initializeRedis(config)

        setInterval(async () => {
            try {
                await this.redis.ping()
                this.logger.debug('PING sent to Redis')
            } catch (error) {
                this.logger.error('PING failed:', error)
            }
        }, 2000)
    }

    private async initializeRedis(config: RedisOptions): Promise<Redis> {
        const redis = new Redis(config)

        redis.on('error', (err) => {
            this.logger.error('Redis connection error:', err)
        })

        redis.on('connect', () => {
            this.logger.log('Successfully connected to Redis')
        })

        redis.on('ready', () => {
            this.logger.log('Redis is ready to accept commands')
        })

        redis.on('reconnecting', () => {
            this.logger.log('Reconnecting to Redis...')
        })

        return redis
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key)
            return data ? JSON.parse(data) : null
        } catch (error) {
            this.logger.error(`Failed to get cache for key '${key}':`, error)
            throw new Error(`Failed to get cache: ${error.message}`)
        }
    }

    async set(
        key: string,
        value: any,
        expirationSeconds: number = this.DEFAULT_EXPIRATION,
    ): Promise<void> {
        try {
            await this.redis.set(
                key,
                bigIntSerializer.stringify(value),
                'EX',
                expirationSeconds,
            )
        } catch (error) {
            this.logger.error(`Failed to set cache for key '${key}':`, error)
            throw new Error(`Failed to set cache: ${error.message}`)
        }
    }

    async setNX(
        key: string,
        value: any,
        expirationSeconds: number = this.DEFAULT_EXPIRATION,
    ): Promise<boolean> {
        try {
            const result = await this.redis.set(
                key,
                bigIntSerializer.stringify(value),
                'EX',
                expirationSeconds,
                'NX',
            )
            return result === 'OK'
        } catch (error) {
            this.logger.error(`Failed to set NX for key '${key}':`, error)
            throw new Error(`Failed to set NX: ${error.message}`)
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key)
            this.logger.debug(`Cache with key '${key}' has been deleted.`)
        } catch (error) {
            this.logger.error(
                `Failed to delete cache with key '${key}':`,
                error,
            )
            throw new Error(`Failed to delete cache: ${error.message}`)
        }
    }

    async clear(): Promise<void> {
        try {
            await this.redis.flushall()
            this.logger.log('Cache has been cleared.')
        } catch (error) {
            this.logger.error('Failed to clear cache:', error)
            throw new Error(`Failed to clear cache: ${error.message}`)
        }
    }

    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        try {
            const results = await this.redis.mget(keys)
            return results.map((result) => (result ? JSON.parse(result) : null))
        } catch (error) {
            this.logger.error('Failed to get multiple keys:', error)
            throw new Error(`Failed to get multiple keys: ${error.message}`)
        }
    }

    async mset(
        keyValues: Record<string, any>,
        expirationSeconds: number = this.DEFAULT_EXPIRATION,
    ): Promise<void> {
        try {
            const pipeline = this.redis.pipeline()

            Object.entries(keyValues).forEach(([key, value]) => {
                pipeline.set(
                    key,
                    bigIntSerializer.stringify(value),
                    'EX',
                    expirationSeconds,
                )
            })

            await pipeline.exec()
        } catch (error) {
            this.logger.error('Failed to set multiple keys:', error)
            throw new Error(`Failed to set multiple keys: ${error.message}`)
        }
    }

    async increment(key: string, value: number = 1): Promise<number> {
        try {
            return await this.redis.incrby(key, value)
        } catch (error) {
            this.logger.error(`Failed to increment key '${key}':`, error)
            throw new Error(`Failed to increment: ${error.message}`)
        }
    }

    async decrement(key: string, value: number = 1): Promise<number> {
        try {
            return await this.redis.decrby(key, value)
        } catch (error) {
            this.logger.error(`Failed to decrement key '${key}':`, error)
            throw new Error(`Failed to decrement: ${error.message}`)
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key)
            return result === 1
        } catch (error) {
            this.logger.error(
                `Failed to check existence of key '${key}':`,
                error,
            )
            throw new Error(`Failed to check key existence: ${error.message}`)
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.redis.ttl(key)
        } catch (error) {
            this.logger.error(`Failed to get TTL for key '${key}':`, error)
            throw new Error(`Failed to get TTL: ${error.message}`)
        }
    }

    async scan(pattern: string): Promise<string[]> {
        try {
            const stream = this.redis.scanStream({
                match: pattern,
                count: 100,
            })

            const keys: string[] = []

            return new Promise((resolve, reject) => {
                stream.on('data', (resultKeys: string[]) => {
                    keys.push(...resultKeys)
                })

                stream.on('end', () => resolve(keys))
                stream.on('error', reject)
            })
        } catch (error) {
            this.logger.error(
                `Failed to scan keys with pattern '${pattern}':`,
                error,
            )
            throw new Error(`Failed to scan keys: ${error.message}`)
        }
    }

    async getClient(): Promise<Redis> {
        return this.redis
    }
}
