import { IRedisConfig } from '@/config/redis/redis-config.interface'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HealthIndicatorResult } from '@nestjs/terminus'
import Redis from 'ioredis'

@Injectable()
export class RedisHealthService {
    private redis: Redis

    constructor(private configService: ConfigService) {
        this.redis = new Redis(this.configService.get<IRedisConfig>('redis'))
    }

    async check(key: string): Promise<HealthIndicatorResult> {
        try {
            const startTime = Date.now()
            const pong = await this.redis.ping()
            const responseTime = Date.now() - startTime

            if (pong !== 'PONG') {
                throw new Error('Redis did not respond with PONG')
            }

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

    onModuleDestroy() {
        if (this.redis) {
            this.redis.disconnect()
        }
    }
}
