import { Injectable, Logger } from '@nestjs/common'
import { AiRateLimitConfig } from './types/ai-rate-limit-config.types'

@Injectable()
export class AiRateLimiterService {
    private readonly logger = new Logger(AiRateLimiterService.name)
    private limiters: Map<
        string,
        {
            timestamps: number[]
            backoff: number
            lastError: number | null
        }
    > = new Map()

    createLimiter(key: string, config: AiRateLimitConfig): void {
        if (!this.limiters.has(key)) {
            this.limiters.set(key, {
                timestamps: [],
                backoff: 0,
                lastError: null,
            })
            this.logger.log(
                `Created rate limiter "${key}" with ${config.maxRequests} requests per ${config.interval}ms`,
            )
        }
    }

    async acquire(key: string, config: AiRateLimitConfig): Promise<void> {
        if (!this.limiters.has(key)) {
            this.createLimiter(key, config)
        }

        const limiter = this.limiters.get(key)
        const now = Date.now()
        const maxWaitTime = config.maxWaitTime || 30000

        if (limiter.lastError && now - limiter.lastError < config.interval) {
            const backoffTime = Math.min(
                limiter.backoff ? limiter.backoff * 2 : config.interval,
                maxWaitTime,
            )

            this.logger.debug(
                `Recent rate limit error for "${key}". Using backoff time of ${backoffTime}ms.`,
            )

            if (backoffTime > maxWaitTime) {
                this.logger.warn(
                    `Rate limit backoff time (${backoffTime}ms) exceeds maximum wait time (${maxWaitTime}ms).`,
                )
                throw new Error(
                    `Rate limit exceeded for "${key}". Maximum backoff time exceeded.`,
                )
            }

            limiter.backoff = backoffTime

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.acquire(key, config)
                        .then(() => resolve())
                        .catch((err) => reject(err))
                }, backoffTime)
            })
        }

        limiter.timestamps = limiter.timestamps.filter(
            (time) => now - time < config.interval,
        )

        if (limiter.timestamps.length < config.maxRequests) {
            limiter.timestamps.push(now)
            return Promise.resolve()
        }

        const oldestTimestamp = limiter.timestamps[0]
        const waitTime = config.interval - (now - oldestTimestamp)

        if (waitTime > maxWaitTime) {
            this.logger.warn(
                `Rate limit exceeded for "${key}". Maximum wait time (${maxWaitTime}ms) exceeded.`,
            )
            throw new Error(
                `Rate limit exceeded for "${key}". Please try again later.`,
            )
        }

        this.logger.debug(
            `Rate limit reached for "${key}". Waiting ${waitTime}ms before next request.`,
        )

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.acquire(key, config)
                    .then(() => resolve())
                    .catch((err) => reject(err))
            }, waitTime + 50)
        })
    }

    notifyRateLimitExceeded(key: string): void {
        if (this.limiters.has(key)) {
            const limiter = this.limiters.get(key)
            limiter.lastError = Date.now()

            if (!limiter.backoff) {
                const config = this.limiters.get(key)
                limiter.backoff = 1000
            }

            this.logger.debug(
                `Rate limiter "${key}" notified of rate limit exceeded. Setting backoff.`,
            )
        }
    }

    reset(key: string): void {
        if (this.limiters.has(key)) {
            this.limiters.delete(key)
            this.logger.log(`Reset rate limiter "${key}"`)
        }
    }
}
