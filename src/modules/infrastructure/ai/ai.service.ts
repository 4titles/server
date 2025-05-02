import { delay as sleep } from '@/shared/utils/time/delay.utils'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DeepseekService } from './deepseek.service'
import { EmptyResponseException } from './exceptions/empty-response-exception'
import { InvalidResponseFormatException } from './exceptions/invalid-response-format-exception'
import { NoAvailableApiKeysException } from './exceptions/no-available-api-keys-exception'
import { RateLimitExceededException } from './exceptions/rate-limit-exceeded-exception'
import { AiCompletionOptions } from './types/ai-completion-options.types'

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name)
    private readonly MAX_EMPTY_RETRIES: number

    constructor(
        private readonly deepseekService: DeepseekService,
        private readonly configService: ConfigService,
    ) {
        this.MAX_EMPTY_RETRIES = this.configService.get<number>(
            'MAX_EMPTY_RETRIES',
            3,
        )
    }

    async completion(
        prompt: string,
        options?: AiCompletionOptions,
    ): Promise<string> {
        let retries = 0
        while (true) {
            try {
                const response = await this.deepseekService.completion(
                    prompt,
                    options,
                )
                if (!response?.trim()) throw new EmptyResponseException('Empty')
                return response
            } catch (err) {
                if (err instanceof RateLimitExceededException) throw err
                if (err instanceof NoAvailableApiKeysException) throw err
                if (
                    err instanceof EmptyResponseException ||
                    err instanceof InvalidResponseFormatException
                ) {
                    if (++retries > this.MAX_EMPTY_RETRIES) throw err
                    const delay = Math.min(1000 * Math.pow(2, retries), 10000)
                    await sleep(delay)
                    continue
                }
                this.logger.error(
                    `Unexpected AI error: ${err.message}`,
                    err.stack,
                )
                throw err
            }
        }
    }
}
