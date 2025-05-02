import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAI } from 'openai'
import { AiApiKeyPoolService } from './ai-api-key-pool.service'
import { AiRateLimiterService } from './ai-rate-limiter.service'
import { RateLimitExceededException } from './exceptions/rate-limit-exceeded-exception'
import { AiCompletionOptions } from './types/ai-completion-options.types'
import { AiRateLimitConfig } from './types/ai-rate-limit-config.types'

@Injectable()
export class DeepseekService {
    private readonly logger = new Logger(DeepseekService.name)
    private readonly model: string

    private readonly RATE_LIMITER_KEY = 'deepseek'
    private readonly PROVIDER_NAME = 'openrouter'
    private readonly rateLimitConfig: AiRateLimitConfig = {
        maxRequests: 10,
        interval: 10000,
        maxWaitTime: 60000,
    }

    constructor(
        private readonly configService: ConfigService,
        private readonly aiRateLimiterService: AiRateLimiterService,
        private readonly aiApiKeyPoolService: AiApiKeyPoolService,
    ) {
        this.model = this.configService.get<string>(
            'OPEN_ROUTER_DEEPSEEK_MODEL',
            'deepseek/deepseek-chat-v3-0324:free',
        )

        this.aiRateLimiterService.createLimiter(
            this.RATE_LIMITER_KEY,
            this.rateLimitConfig,
        )

        this.logger.log(`Initialized DeepseekService with model: ${this.model}`)
        this.logger.log(
            `Available API keys: ${this.aiApiKeyPoolService.getAllKeys().length}`,
        )
    }

    private createClient(apiKey: string): OpenAI {
        return new OpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        })
    }

    async completion(
        prompt: string,
        options?: AiCompletionOptions,
    ): Promise<string> {
        const available = this.aiApiKeyPoolService.getAllKeys()
        if (!available.length) {
            this.logger.error('No available API keys')
            throw new RateLimitExceededException('No API keys available')
        }

        for (const info of available) {
            const key = info.key

            try {
                await this.aiRateLimiterService.acquire(
                    this.PROVIDER_NAME,
                    this.rateLimitConfig,
                )

                const client = new OpenAI({
                    apiKey: key,
                    baseURL: 'https://openrouter.ai/api/v1',
                })

                this.logger.debug(
                    `Using key ending ${key.slice(-4)} to send request`,
                )

                const response = await client.chat.completions.create({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 1024,
                })

                const content = response.choices?.[0]?.message?.content
                if (!content) throw new Error('No content in response')

                this.aiApiKeyPoolService.resetKeyBackoff(key)
                return content
            } catch (err: any) {
                if (
                    err instanceof RateLimitExceededException ||
                    err.status === 429
                ) {
                    this.aiApiKeyPoolService.markKeyAsRateLimited(key)
                    this.logger.warn(
                        `Rate limit on key ${key.slice(-4)}, trying next key...`,
                    )
                    continue
                }
                if (err.status === 401) {
                    this.aiApiKeyPoolService.markKeyAsBlocked(key)
                    this.logger.error(
                        `Auth error on key ${key.slice(-4)}, blocking key...`,
                    )
                    continue
                }
                this.logger.error(
                    `Error with key ${key.slice(-4)}: ${err.message}`,
                    err.stack,
                )
                continue
            }
        }

        this.logger.error('All API keys exhausted or rate-limited')
        throw new RateLimitExceededException('All API keys exhausted')
    }
}
